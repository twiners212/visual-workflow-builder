import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { AlertTriangle } from "lucide-react";

interface UnknownNodeProps {
  data: {
    originalType?: string;
    [key: string]: any;
  };
  selected?: boolean;
}

export const UnknownNode = memo(({ data, selected }: UnknownNodeProps) => {
  return (
    <div
      className={`relative min-w-[240px] rounded-xl border bg-surface-variant p-4 shadow-sm transition-all ${
        selected ? "border-error ring-1 ring-error shadow-md" : "border-error/40"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-surface bg-error"
      />
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-label-lg text-sm font-semibold text-on-surface">
              Unknown Node
            </h3>
            <p className="font-body-md text-xs text-error">
              Unsupported type: {data.originalType || "unknown"}
            </p>
          </div>
        </div>

        <div className="rounded bg-error/5 p-2 text-[10px] text-error/80 border border-error/10">
          This node type is not recognized by the current version of the application. It has been preserved to maintain edge connections.
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-surface bg-error"
      />
    </div>
  );
});

UnknownNode.displayName = "UnknownNode";
