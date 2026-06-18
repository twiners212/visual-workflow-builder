import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { getExecutionsAction } from "@/features/execution/server/actions";
import { Play, Calendar, Clock, ChevronRight, Activity, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function ExecutionsHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const res = await getExecutionsAction();
  const runs = res.success && res.data ? res.data : [];

  const formatDuration = (ms: number | null) => {
    if (ms === null || ms === undefined) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Activity className="w-3 h-3 animate-spin" />
            Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
            Pending
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-lg w-full max-w-6xl mx-auto p-md select-none">
        {/* Header Section */}
        <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
              Execution History
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              View and debug runs of your published automation workflows.
            </p>
          </div>
        </div>

        {/* Runs Content */}
        {runs.length === 0 ? (
          <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center text-center shadow-sm min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-md">
              <Activity className="w-8 h-8 text-outline" />
            </div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-xs">
              No executions yet
            </h3>
            <p className="font-body-md text-[14px] text-on-surface-variant max-w-sm mb-lg">
              Published workflows will log executions here once they are triggered manually or via endpoints.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-lg hover:opacity-90 font-label-md text-body-md transition-all shadow-sm active:scale-95"
            >
              <Play className="w-4 h-4 fill-on-primary" />
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-container-low/50">
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-bold">
                      Workflow
                    </th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-bold">
                      Status
                    </th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-bold">
                      Started At
                    </th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-bold">
                      Duration
                    </th>
                    <th className="px-lg py-md w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-lg py-md font-medium text-on-surface">
                        <Link
                          href={`/executions/${run.id}`}
                          className="block font-semibold hover:text-primary transition-colors text-[14px]"
                        >
                          {run.workflow.title}
                        </Link>
                      </td>
                      <td className="px-lg py-md">
                        <Link href={`/executions/${run.id}`} className="block">
                          {getStatusBadge(run.status)}
                        </Link>
                      </td>
                      <td className="px-lg py-md text-[13px] text-on-surface-variant">
                        <Link href={`/executions/${run.id}`} className="block flex items-center gap-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(run.startedAt).toLocaleString()}
                        </Link>
                      </td>
                      <td className="px-lg py-md text-[13px] text-on-surface-variant">
                        <Link href={`/executions/${run.id}`} className="block flex items-center gap-xs font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(run.duration)}
                        </Link>
                      </td>
                      <td className="px-lg py-md text-right">
                        <Link
                          href={`/executions/${run.id}`}
                          className="text-on-surface-variant hover:text-primary transition-colors block"
                        >
                          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
