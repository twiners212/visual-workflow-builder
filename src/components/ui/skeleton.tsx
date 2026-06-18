import React from "react";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-container-highest/60 ${className}`}
      {...props}
    />
  );
}

export function WorkflowCardSkeleton() {
  return (
    <div className="p-md border border-outline-variant bg-surface-container-lowest rounded-xl flex flex-col justify-between h-40 shadow-sm animate-pulse select-none">
      <div>
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 mt-sm rounded" />
      </div>
      <div className="flex items-center justify-between mt-md pt-sm border-t border-outline-variant/30">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-lg border-b border-outline-variant/30 bg-surface-container-lowest select-none animate-pulse">
      <div className="flex-1 flex flex-col gap-sm">
        <Skeleton className="h-5 w-48 rounded" />
      </div>
      <div className="flex-1 flex gap-sm items-center">
        <Skeleton className="h-6 w-20 rounded" />
      </div>
      <div className="flex-1 flex gap-sm items-center">
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="flex-1 flex gap-sm items-center">
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    </div>
  );
}
