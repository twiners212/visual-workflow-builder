"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { workflowRepository } from "./repository";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createWorkflowSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

const renameWorkflowSchema = z.object({
  workflowId: z.string().uuid("Invalid Workflow ID"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
});

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getWorkflowsAction() {
  try {
    const user = await getSessionUser();
    const data = await workflowRepository.getWorkflows(user.id);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch workflows" };
  }
}

export async function createWorkflowAction(title: string, description?: string) {
  try {
    const user = await getSessionUser();
    const validated = createWorkflowSchema.parse({ title, description });

    const result = await workflowRepository.createWorkflow(user.id, {
      title: validated.title,
      description: validated.description,
    });

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message };
    }
    return { success: false, error: err.message || "Failed to create workflow" };
  }
}

export async function renameWorkflowAction(workflowId: string, title: string) {
  try {
    await getSessionUser();
    const validated = renameWorkflowSchema.parse({ workflowId, title });

    const result = await workflowRepository.renameWorkflow(
      validated.workflowId,
      validated.title
    );

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message };
    }
    return { success: false, error: err.message || "Failed to rename workflow" };
  }
}

export async function deleteWorkflowAction(workflowId: string) {
  try {
    await getSessionUser();
    const result = await workflowRepository.deleteWorkflow(workflowId);

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete workflow" };
  }
}

export async function toggleFavoriteAction(workflowId: string) {
  try {
    await getSessionUser();
    const result = await workflowRepository.toggleFavorite(workflowId);

    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle favorite status" };
  }
}

import { versionService, NodeInput, EdgeInput } from "./version-service";

export async function saveDraftAction(
  versionId: string,
  inputNodes: NodeInput[],
  inputEdges: EdgeInput[]
) {
  try {
    await getSessionUser();
    const result = await versionService.saveDraft(versionId, inputNodes, inputEdges);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save draft" };
  }
}

export async function publishDraftAction(workflowId: string) {
  try {
    await getSessionUser();
    const result = await versionService.publishDraft(workflowId);
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to publish workflow" };
  }
}

