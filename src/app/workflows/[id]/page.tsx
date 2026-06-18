import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { workflows, workflowVersions, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import EditorCanvas from "@/features/workflow/components/editor-canvas";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowEditorPage({ params }: PageProps) {
  const { id: workflowId } = await params;

  // 1. Verify User Session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  // 2. Fetch Workflow
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
  });

  if (!workflow) {
    notFound();
  }

  // 3. Authorization Check
  if (workflow.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // 3.5 Fetch User Preferences
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  // 4. Fetch Active Draft Version
  const draftVersion = await db.query.workflowVersions.findFirst({
    where: and(
      eq(workflowVersions.workflowId, workflowId),
      eq(workflowVersions.status, "draft")
    ),
    with: {
      nodes: true,
      edges: true,
    },
  });

  if (!draftVersion) {
    // If no draft version exists (should not happen normally), create one
    // or return 404/error.
    notFound();
  }

  // 5. Map Database Nodes and Edges to React Flow structure
  const initialNodes = draftVersion.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: {
      name: n.name,
      configuration: n.configuration || {},
    },
  }));

  const initialEdges = draftVersion.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label || undefined,
    data: {
      branch: e.label ? e.label.toLowerCase() : undefined,
    },
  }));

  return (
    <EditorCanvas
      workflowId={workflow.id}
      versionId={draftVersion.id}
      workflowTitle={workflow.title}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      userPreferences={user?.preferences || {}}
    />
  );
}
