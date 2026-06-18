import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { workflowRepository } from "@/features/workflow/server/repository";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { AppLayout } from "@/components/layout/app-layout";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const workflowsList = await workflowRepository.getWorkflows(session.user.id);

  return (
    <AppLayout>
      <DashboardView initialWorkflows={workflowsList} />
    </AppLayout>
  );
}
