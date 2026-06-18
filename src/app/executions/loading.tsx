import { AppLayout } from "@/components/layout/app-layout";
import { TableRowSkeleton } from "@/components/ui/skeleton";

export default function ExecutionsLoading() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-lg w-full max-w-6xl mx-auto p-md select-none animate-pulse">
        {/* Title area */}
        <div className="h-8 w-64 bg-surface-container-highest rounded-md mb-md"></div>
        <div className="h-4 w-96 bg-surface-container-highest rounded mb-lg"></div>

        {/* Table layout container */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-outline-variant bg-surface-container-low/50 p-md flex items-center justify-between">
            <div className="h-4 w-32 bg-surface-container-highest rounded"></div>
            <div className="h-4 w-20 bg-surface-container-highest rounded"></div>
            <div className="h-4 w-32 bg-surface-container-highest rounded"></div>
            <div className="h-4 w-16 bg-surface-container-highest rounded"></div>
          </div>
          <div className="divide-y divide-outline-variant/30">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
