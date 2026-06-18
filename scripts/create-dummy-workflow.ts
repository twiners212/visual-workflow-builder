import { db } from "../src/db";
import { users, workflows, workflowVersions, executions, executionLogs, nodes, edges } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting seed of dummy workflow for user1@company.com...");
  
  // 1. Get or create user
  const email = "user1@company.com";
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  
  if (!user) {
    console.log(`User ${email} not found. Creating one...`);
    const newUserId = "user-1-id";
    await db.insert(users).values({
      id: newUserId,
      name: "Test User 1",
      email: email,
      emailVerified: true,
      preferences: {
        theme: "dark",
        accentColor: "purple",
      },
    });
    user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }
  
  if (!user) {
    throw new Error("Failed to find or create user.");
  }
  
  const userId = user.id;
  console.log(`Using user ID: ${userId}`);
  
  // 2. Create Workflow
  const workflowId = "wf-dummy-test";
  // Delete existing dummy workflow first to allow re-runs
  await db.delete(workflows).where(eq(workflows.id, workflowId));
  
  console.log("Inserting workflow...");
  await db.insert(workflows).values({
    id: workflowId,
    userId: userId,
    title: "Data Sync & Notification Pipeline",
    description: "A dummy workflow configured to test execution history logs, featuring triggers, conditions, and API requests.",
    isFavorite: true,
  });
  
  // 3. Create Workflow Version (published)
  const versionId = "wf-dummy-version-1";
  console.log("Inserting workflow version...");
  await db.insert(workflowVersions).values({
    id: versionId,
    workflowId: workflowId,
    versionNumber: 1,
    status: "published",
    publishedAt: new Date(),
  });
  
  // Update current version on workflow
  await db.update(workflows).set({ currentVersionId: versionId }).where(eq(workflows.id, workflowId));
  
  // 4. Create Nodes
  console.log("Inserting nodes...");
  const triggerNodeId = "node-trigger-1";
  const httpNodeId = "node-http-1";
  const ifNodeId = "node-if-1";
  
  await db.insert(nodes).values([
    {
      id: triggerNodeId,
      workflowVersionId: versionId,
      type: "trigger",
      name: "Manual Trigger",
      positionX: 100,
      positionY: 200,
      configuration: {},
    },
    {
      id: httpNodeId,
      workflowVersionId: versionId,
      type: "action",
      name: "Fetch User Details",
      positionX: 300,
      positionY: 200,
      configuration: {
        url: "https://api.example.com/users",
        method: "GET",
      },
    },
    {
      id: ifNodeId,
      workflowVersionId: versionId,
      type: "logic",
      name: "Check Status",
      positionX: 550,
      positionY: 200,
      configuration: {
        condition: "status == 'active'",
      },
    },
  ]);
  
  // 5. Create Edges
  console.log("Inserting edges...");
  await db.insert(edges).values([
    {
      id: "edge-1",
      workflowVersionId: versionId,
      sourceNodeId: triggerNodeId,
      targetNodeId: httpNodeId,
    },
    {
      id: "edge-2",
      workflowVersionId: versionId,
      sourceNodeId: httpNodeId,
      targetNodeId: ifNodeId,
    },
  ]);
  
  // 6. Create Executions (History)
  console.log("Inserting executions...");
  const execSuccessId = "exec-success-001";
  const execFailedId = "exec-failed-002";
  const execRunningId = "exec-running-003";
  
  const now = new Date();
  
  // Exec 1: Success (10 mins ago)
  await db.insert(executions).values({
    id: execSuccessId,
    workflowId: workflowId,
    workflowVersionId: versionId,
    status: "success",
    startedAt: new Date(now.getTime() - 10 * 60 * 1000),
    finishedAt: new Date(now.getTime() - 9 * 60 * 1000),
    duration: 60000,
  });
  
  // Exec 1 Logs
  await db.insert(executionLogs).values([
    {
      id: "log-s1",
      executionId: execSuccessId,
      nodeId: triggerNodeId,
      status: "success",
      message: "Triggered successfully by user1@company.com",
      startedAt: new Date(now.getTime() - 10 * 60 * 1000),
      finishedAt: new Date(now.getTime() - 10 * 60 * 1000 + 100),
    },
    {
      id: "log-s2",
      executionId: execSuccessId,
      nodeId: httpNodeId,
      status: "success",
      message: "GET https://api.example.com/users returned 200 OK",
      startedAt: new Date(now.getTime() - 10 * 60 * 1000 + 200),
      finishedAt: new Date(now.getTime() - 10 * 60 * 1000 + 5000),
    },
    {
      id: "log-s3",
      executionId: execSuccessId,
      nodeId: ifNodeId,
      status: "success",
      message: "Condition 'status == active' evaluated to True",
      startedAt: new Date(now.getTime() - 10 * 60 * 1000 + 5100),
      finishedAt: new Date(now.getTime() - 9 * 60 * 1000),
    },
  ]);
  
  // Exec 2: Failed (5 mins ago)
  await db.insert(executions).values({
    id: execFailedId,
    workflowId: workflowId,
    workflowVersionId: versionId,
    status: "failed",
    startedAt: new Date(now.getTime() - 5 * 60 * 1000),
    finishedAt: new Date(now.getTime() - 4.8 * 60 * 1000),
    duration: 12000,
  });
  
  // Exec 2 Logs
  await db.insert(executionLogs).values([
    {
      id: "log-f1",
      executionId: execFailedId,
      nodeId: triggerNodeId,
      status: "success",
      message: "Triggered successfully by user1@company.com",
      startedAt: new Date(now.getTime() - 5 * 60 * 1000),
      finishedAt: new Date(now.getTime() - 5 * 60 * 1000 + 100),
    },
    {
      id: "log-f2",
      executionId: execFailedId,
      nodeId: httpNodeId,
      status: "failed",
      message: "GET https://api.example.com/users failed: Network Timeout",
      startedAt: new Date(now.getTime() - 5 * 60 * 1000 + 200),
      finishedAt: new Date(now.getTime() - 4.8 * 60 * 1000),
    },
  ]);
  
  // Exec 3: Running (1 min ago - still running)
  await db.insert(executions).values({
    id: execRunningId,
    workflowId: workflowId,
    workflowVersionId: versionId,
    status: "running",
    startedAt: new Date(now.getTime() - 1 * 60 * 1000),
  });
  
  // Exec 3 Logs
  await db.insert(executionLogs).values([
    {
      id: "log-r1",
      executionId: execRunningId,
      nodeId: triggerNodeId,
      status: "success",
      message: "Triggered successfully by user1@company.com",
      startedAt: new Date(now.getTime() - 1 * 60 * 1000),
      finishedAt: new Date(now.getTime() - 1 * 60 * 1000 + 100),
    },
    {
      id: "log-r2",
      executionId: execRunningId,
      nodeId: httpNodeId,
      status: "running",
      message: "Executing GET https://api.example.com/users...",
      startedAt: new Date(now.getTime() - 1 * 60 * 1000 + 200),
    },
  ]);
  
  console.log("Dummy workflow and execution history seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed dummy data:", err);
  process.exit(1);
});
