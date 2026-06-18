import { db } from "@/db";
import { workflows, workflowVersions, nodes, edges, executions, executionLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function resolvePath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export const executor = {
  async runWorkflow(workflowId: string) {
    const executionId = crypto.randomUUID();
    const startTime = Date.now();

    // 1. Fetch the active published version of the workflow
    const publishedVersion = await db.query.workflowVersions.findFirst({
      where: and(
        eq(workflowVersions.workflowId, workflowId),
        eq(workflowVersions.status, "published")
      ),
    });

    if (!publishedVersion) {
      throw new Error("Cannot execute workflow: No published version found. Please Publish first.");
    }

    // 2. Create the execution record
    const [execution] = await db
      .insert(executions)
      .values({
        id: executionId,
        workflowId,
        workflowVersionId: publishedVersion.id,
        status: "running",
        startedAt: new Date(),
      })
      .returning();

    // Run execution logic in background or inline (we do it inline here since it is async)
    try {
      // 3. Load all nodes and edges for the published version
      const dbNodes = await db.query.nodes.findMany({
        where: eq(nodes.workflowVersionId, publishedVersion.id),
      });

      const dbEdges = await db.query.edges.findMany({
        where: eq(edges.workflowVersionId, publishedVersion.id),
      });

      // 4. Find trigger node
      const triggerNode = dbNodes.find((n) => n.type === "trigger");
      if (!triggerNode) {
        throw new Error("Trigger node not found in this workflow version.");
      }

      // Initialize traversal state
      const nodeOutputs: Record<string, any> = {};
      let currentNode = triggerNode;
      let precedingNodeId: string | null = null;
      let stepCount = 0;
      const maxSteps = 100; // Protection against infinite loops

      while (currentNode && stepCount < maxSteps) {
        stepCount++;
        const logId = crypto.randomUUID();

        // Create initial log entry
        await db.insert(executionLogs).values({
          id: logId,
          executionId,
          nodeId: currentNode.id,
          status: "running",
          startedAt: new Date(),
        });

        let status: "success" | "failed" = "success";
        let message = "";
        let nodeOutput: any = {};

        try {
          const config = (currentNode.configuration as any) || {};

          if (currentNode.type === "trigger") {
            nodeOutput = { triggered: true, description: config.description };
            message = "Manual trigger activated successfully.";
          } else if (currentNode.type === "action") {
            // HTTP Request action node
            const url = config.url || "https://api.example.com";
            const method = config.method || "GET";
            const timeoutVal = (Number(config.timeout) || 5) * 1000;
            const maxRetries = Math.min(Math.max(Number(config.retries) || 0, 0), 5);
            const retryDelayVal = Math.min(Math.max(Number(config.retryDelay) || 1000, 100), 10000);

            let attempts = 0;
            let success = false;
            let lastErrorMsg = "";

            while (attempts <= maxRetries && !success) {
              attempts++;
              const controller = new AbortController();
              const fetchTimeout = setTimeout(() => controller.abort(), timeoutVal);
              const fetchStartTime = Date.now();

              try {
                const response = await fetch(url, {
                  method,
                  signal: controller.signal,
                });
                clearTimeout(fetchTimeout);

                let body: any = null;
                const contentType = response.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                  body = await response.json();
                } else {
                  body = await response.text();
                }

                const fetchDuration = Date.now() - fetchStartTime;
                nodeOutput = {
                  status: response.status,
                  body,
                  duration: fetchDuration,
                };

                if (response.ok) {
                  message = `HTTP Request succeeded with status ${response.status} on attempt ${attempts}`;
                  status = "success";
                  success = true;
                } else {
                  // Check if error is transient (429 or 5xx)
                  const isTransient = response.status === 429 || response.status >= 500;
                  lastErrorMsg = `HTTP Request failed with status ${response.status}`;
                  
                  if (isTransient && attempts <= maxRetries) {
                    const retryStatusMsg = `Attempt ${attempts}/${maxRetries + 1} failed: Status ${response.status}. Retrying in ${retryDelayVal}ms...`;
                    await db
                      .update(executionLogs)
                      .set({
                        message: JSON.stringify({ message: retryStatusMsg, output: nodeOutput }),
                      })
                      .where(eq(executionLogs.id, logId));
                    
                    await new Promise((resolve) => setTimeout(resolve, retryDelayVal));
                  } else {
                    status = "failed";
                    message = lastErrorMsg;
                    break;
                  }
                }
              } catch (fetchErr: any) {
                clearTimeout(fetchTimeout);
                const isTimeout = fetchErr.name === "AbortError" || fetchErr.message?.includes("timeout") || fetchErr.message?.includes("aborted");
                const errDetail = isTimeout ? `Request timed out after ${timeoutVal / 1000}s` : (fetchErr.message || "Network error");
                lastErrorMsg = `HTTP Fetch error: ${errDetail}`;
                nodeOutput = { error: lastErrorMsg };

                if (attempts <= maxRetries) {
                  const retryStatusMsg = `Attempt ${attempts}/${maxRetries + 1} failed: ${errDetail}. Retrying in ${retryDelayVal}ms...`;
                  await db
                    .update(executionLogs)
                    .set({
                      message: JSON.stringify({ message: retryStatusMsg, output: nodeOutput }),
                    })
                    .where(eq(executionLogs.id, logId));
                  
                  await new Promise((resolve) => setTimeout(resolve, retryDelayVal));
                } else {
                  status = "failed";
                  message = lastErrorMsg;
                  break;
                }
              }
            }
          } else if (currentNode.type === "logic") {
            // IF Condition logic node
            const field = config.field || "status";
            const operator = config.operator || "==";
            const expectedValue = config.value || "completed";

            // Resolve actual value from the preceding node's output
            const precedingOutput = precedingNodeId ? nodeOutputs[precedingNodeId] : null;
            const actualValue = precedingOutput ? resolvePath(precedingOutput, field) : undefined;

            let evaluationResult = false;
            if (operator === "==") {
              evaluationResult = String(actualValue) === String(expectedValue);
            } else if (operator === "!=") {
              evaluationResult = String(actualValue) !== String(expectedValue);
            } else if (operator === ">") {
              evaluationResult = Number(actualValue) > Number(expectedValue);
            } else if (operator === "<") {
              evaluationResult = Number(actualValue) < Number(expectedValue);
            } else if (operator === "contains") {
              evaluationResult = String(actualValue)
                .toLowerCase()
                .includes(String(expectedValue).toLowerCase());
            }

            const branch = evaluationResult ? "true" : "false";
            nodeOutput = {
              evaluated: evaluationResult,
              branch,
              field,
              operator,
              expectedValue,
              actualValue: actualValue !== undefined ? actualValue : null,
            };
            message = `IF Condition evaluated to ${evaluationResult ? "True" : "False"} (${actualValue || "undefined"} ${operator} ${expectedValue})`;
          } else if (currentNode.type === "ai") {
            // AI Placeholder node
            nodeOutput = {
              executed: true,
              placeholder: true,
              prompt: config.prompt || "",
            };
            message = `AI Prompt placeholder executed successfully: "${config.prompt || ""}" (Execution placeholder - Coming Soon).`;
          }

          nodeOutputs[currentNode.id] = nodeOutput;
        } catch (nodeErr: any) {
          status = "failed";
          message = `Internal execution error: ${nodeErr.message}`;
          nodeOutput = { error: message };
          nodeOutputs[currentNode.id] = nodeOutput;
        }

        // Update log entry with results
        await db
          .update(executionLogs)
          .set({
            status,
            message: JSON.stringify({ message, output: nodeOutput }),
            finishedAt: new Date(),
          })
          .where(eq(executionLogs.id, logId));

        if (status === "failed") {
          throw new Error(message || `Execution failed at node: ${currentNode.name}`);
        }

        // Find next node
        precedingNodeId = currentNode.id;
        let nextNode: typeof triggerNode | undefined = undefined;

        if (currentNode.type === "logic") {
          // Find matching branch edge (true/false)
          const targetBranch = nodeOutput.branch; // "true" or "false"
          const matchingEdge = dbEdges.find(
            (e) =>
              e.sourceNodeId === currentNode.id &&
              e.label?.toLowerCase() === targetBranch
          );
          if (matchingEdge) {
            nextNode = dbNodes.find((n) => n.id === matchingEdge.targetNodeId);
          }
        } else {
          // Regular sequential transition
          const matchingEdge = dbEdges.find((e) => e.sourceNodeId === currentNode.id);
          if (matchingEdge) {
            nextNode = dbNodes.find((n) => n.id === matchingEdge.targetNodeId);
          }
        }

        currentNode = nextNode as any;
      }

      if (stepCount >= maxSteps) {
        throw new Error("Max execution steps exceeded. Potential infinite loop detected.");
      }

      // 5. Update execution to success
      const duration = Date.now() - startTime;
      const [updatedExecution] = await db
        .update(executions)
        .set({
          status: "success",
          finishedAt: new Date(),
          duration,
        })
        .where(eq(executions.id, executionId))
        .returning();

      return updatedExecution;
    } catch (executionErr: any) {
      console.error("Workflow Execution failed:", executionErr);
      const duration = Date.now() - startTime;
      const [updatedExecution] = await db
        .update(executions)
        .set({
          status: "failed",
          finishedAt: new Date(),
          duration,
        })
        .where(eq(executions.id, executionId))
        .returning();

      return updatedExecution;
    }
  },
};
