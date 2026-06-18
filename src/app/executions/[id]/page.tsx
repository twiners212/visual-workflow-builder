import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getExecutionDetailsAction } from "@/features/execution/server/actions";
import { AppLayout } from "@/components/layout/app-layout";
import { ExecutionDetailsView } from "@/components/executions/execution-details-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExecutionDetailsPage({ params }: PageProps) {
  const { id: executionId } = await params;

  // 1. Authenticate user session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  // 2. Fetch execution logs details
  const res = await getExecutionDetailsAction(executionId);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <AppLayout>
      <ExecutionDetailsView initialData={res.data as any} />
    </AppLayout>
  );
}
