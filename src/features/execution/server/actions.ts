"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { executions, workflows, executionLogs } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { executor } from "./executor";
import { revalidatePath } from "next/cache";

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function executeWorkflowAction(workflowId: string) {
  try {
    const user = await getSessionUser();

    // Verify ownership of workflow
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow || workflow.userId !== user.id) {
      return { success: false, error: "Workflow not found or unauthorized" };
    }

    const result = await executor.runWorkflow(workflowId);

    revalidatePath("/executions");
    revalidatePath(`/workflows/${workflowId}`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to execute workflow" };
  }
}

export async function getExecutionsAction() {
  try {
    const user = await getSessionUser();

    // 1. Fetch user workflows to filter executions
    const userWorkflows = await db.query.workflows.findMany({
      where: eq(workflows.userId, user.id),
      columns: { id: true },
    });

    const workflowIds = userWorkflows.map((w) => w.id);
    if (workflowIds.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Fetch executions for these workflows
    const data = await db.query.executions.findMany({
      where: inArray(executions.workflowId, workflowIds),
      orderBy: [desc(executions.startedAt)],
      with: {
        workflow: {
          columns: {
            title: true,
          },
        },
      },
    });

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch execution history" };
  }
}

export async function getExecutionDetailsAction(executionId: string) {
  try {
    const user = await getSessionUser();

    // Fetch execution details with associated workflow and logs
    const data = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
      with: {
        workflow: true,
        version: true,
        logs: {
          orderBy: [desc(executionLogs.startedAt)], // Will reverse sort to show newest first, but client can sort as needed
        },
      },
    });

    if (!data) {
      return { success: false, error: "Execution not found" };
    }

    // Verify ownership
    if (data.workflow.userId !== user.id) {
      return { success: false, error: "Unauthorized access to execution details" };
    }

    // Sort logs chronologically for easier timeline rendering
    const chronologicalLogs = [...data.logs].sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
    );

    return {
      success: true,
      data: {
        ...data,
        logs: chronologicalLogs,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch execution details" };
  }
}
