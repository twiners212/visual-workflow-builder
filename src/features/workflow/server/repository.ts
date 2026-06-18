import { db } from "@/db";
import { workflows, workflowVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface CreateWorkflowInput {
  title: string;
  description?: string;
  thumbnail?: string;
}

export const workflowRepository = {
  async getWorkflows(userId: string) {
    return db.query.workflows.findMany({
      where: eq(workflows.userId, userId),
      orderBy: [desc(workflows.updatedAt)],
      with: {
        versions: {
          orderBy: [desc(workflowVersions.versionNumber)],
        },
      },
    });
  },

  async createWorkflow(userId: string, input: CreateWorkflowInput) {
    const workflowId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    // Create workflow container and initial draft version in a transaction
    return db.transaction(async (tx) => {
      const [newWorkflow] = await tx
        .insert(workflows)
        .values({
          id: workflowId,
          userId,
          title: input.title,
          description: input.description || null,
          thumbnail: input.thumbnail || null,
          currentVersionId: null, // No published version initially
          isFavorite: false,
        })
        .returning();

      const [newVersion] = await tx
        .insert(workflowVersions)
        .values({
          id: versionId,
          workflowId: workflowId,
          versionNumber: 1,
          status: "draft",
        })
        .returning();

      return { workflow: newWorkflow, version: newVersion };
    });
  },

  async renameWorkflow(workflowId: string, title: string) {
    const [updated] = await db
      .update(workflows)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId))
      .returning();
    return updated;
  },

  async deleteWorkflow(workflowId: string) {
    const [deleted] = await db
      .delete(workflows)
      .where(eq(workflows.id, workflowId))
      .returning();
    return deleted;
  },

  async toggleFavorite(workflowId: string) {
    // 1. Get current workflow favorite state
    const current = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
      columns: { isFavorite: true },
    });

    if (!current) throw new Error("Workflow not found");

    const [updated] = await db
      .update(workflows)
      .set({
        isFavorite: !current.isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId))
      .returning();

    return updated;
  },
};
