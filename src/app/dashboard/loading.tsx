import { AppLayout } from "@/components/layout/app-layout";
import { WorkflowCardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-lg w-full max-w-6xl mx-auto p-md select-none animate-pulse">
        {/* Title area */}
        <div className="h-8 w-48 bg-surface-container-highest rounded-md mb-md"></div>
        <div className="h-4 w-96 bg-surface-container-highest rounded mb-lg"></div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between">
              <div className="h-4 w-24 bg-surface-container-highest rounded"></div>
              <div className="h-8 w-12 bg-surface-container-highest rounded mt-sm"></div>
            </div>
          ))}
        </div>

        {/* Search & Action bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-md mb-md">
          <div className="h-10 w-full sm:w-80 bg-surface-container-highest rounded-full"></div>
          <div className="h-10 w-36 bg-surface-container-highest rounded-lg"></div>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <WorkflowCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
