import { db } from "@/db";
import { workflowVersions, workflows, nodes, edges } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface NodeInput {
  id: string;
  type: "trigger" | "action" | "logic" | "ai";
  name: string;
  positionX: number;
  positionY: number;
  configuration?: any;
}

export interface EdgeInput {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
}

export const versionService = {
  async saveDraft(versionId: string, inputNodes: NodeInput[], inputEdges: EdgeInput[]) {
    return db.transaction(async (tx) => {
      // 1. Verify the version exists and is a draft
      const version = await tx.query.workflowVersions.findFirst({
        where: eq(workflowVersions.id, versionId),
      });

      if (!version) throw new Error("Workflow version not found");
      if (version.status !== "draft") throw new Error("Can only save changes to a Draft version");

      // 2. Delete existing nodes and edges for this version
      await tx.delete(nodes).where(eq(nodes.workflowVersionId, versionId));
      await tx.delete(edges).where(eq(edges.workflowVersionId, versionId));

      // 3. Insert new nodes if any
      if (inputNodes.length > 0) {
        await tx.insert(nodes).values(
          inputNodes.map((n) => ({
            id: n.id,
            workflowVersionId: versionId,
            type: n.type,
            name: n.name,
            positionX: n.positionX,
            positionY: n.positionY,
            configuration: n.configuration || {},
          }))
        );
      }

      // 4. Insert new edges if any
      if (inputEdges.length > 0) {
        await tx.insert(edges).values(
          inputEdges.map((e) => ({
            id: e.id,
            workflowVersionId: versionId,
            sourceNodeId: e.sourceNodeId,
            targetNodeId: e.targetNodeId,
            label: e.label || null,
          }))
        );
      }

      // 5. Update version timestamp
      const [updatedVersion] = await tx
        .update(workflowVersions)
        .set({ updatedAt: new Date() })
        .where(eq(workflowVersions.id, versionId))
        .returning();

      return updatedVersion;
    });
  },

  async publishDraft(workflowId: string) {
    return db.transaction(async (tx) => {
      // 1. Find the current draft version of the workflow
      const draftVersion = await tx.query.workflowVersions.findFirst({
        where: and(
          eq(workflowVersions.workflowId, workflowId),
          eq(workflowVersions.status, "draft")
        ),
      });

      if (!draftVersion) throw new Error("No active draft version found to publish");

      // 2. Find nodes and edges of this draft version (to copy later)
      const draftNodes = await tx.query.nodes.findMany({
        where: eq(nodes.workflowVersionId, draftVersion.id),
      });
      const draftEdges = await tx.query.edges.findMany({
        where: eq(edges.workflowVersionId, draftVersion.id),
      });

      // 3. Find the currently published version (if any) and archive it
      const currentPublished = await tx.query.workflowVersions.findFirst({
        where: and(
          eq(workflowVersions.workflowId, workflowId),
          eq(workflowVersions.status, "published")
        ),
      });

      if (currentPublished) {
        await tx
          .update(workflowVersions)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(workflowVersions.id, currentPublished.id));
      }

      // 4. Promote draft to published
      await tx
        .update(workflowVersions)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workflowVersions.id, draftVersion.id));

      // 5. Update workflow current version pointer
      await tx
        .update(workflows)
        .set({
          currentVersionId: draftVersion.id,
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, workflowId));

      // 6. Create a brand new Draft version
      const newDraftId = crypto.randomUUID();
      const nextVersionNumber = draftVersion.versionNumber + 1;

      await tx
        .insert(workflowVersions)
        .values({
          id: newDraftId,
          workflowId: workflowId,
          versionNumber: nextVersionNumber,
          status: "draft",
        });

      // 7. Clone the published nodes and edges into the new draft
      const nodeIdMap = new Map<string, string>();
      if (draftNodes.length > 0) {
        const nodesToInsert = draftNodes.map((n) => {
          const newId = crypto.randomUUID();
          nodeIdMap.set(n.id, newId);
          return {
            id: newId,
            workflowVersionId: newDraftId,
            type: n.type,
            name: n.name,
            positionX: n.positionX,
            positionY: n.positionY,
            configuration: n.configuration || {},
          };
        });
        await tx.insert(nodes).values(nodesToInsert);
      }

      if (draftEdges.length > 0) {
        await tx.insert(edges).values(
          draftEdges.map((e) => ({
            id: crypto.randomUUID(),
            workflowVersionId: newDraftId,
            sourceNodeId: nodeIdMap.get(e.sourceNodeId) || e.sourceNodeId,
            targetNodeId: nodeIdMap.get(e.targetNodeId) || e.targetNodeId,
            label: e.label,
          }))
        );
      }

      return { publishedVersionId: draftVersion.id, newDraftVersionId: newDraftId };
    });
  },
};
