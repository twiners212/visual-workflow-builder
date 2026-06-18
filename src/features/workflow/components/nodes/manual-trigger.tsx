import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";

interface ManualTriggerNodeProps {
  data: {
    name?: string;
    description?: string;
    configuration?: {
      description?: string;
    };
  };
  selected?: boolean;
}

export default function ManualTriggerNode({ data, selected }: ManualTriggerNodeProps) {
  return (
    <div
      className={`w-[240px] bg-surface-container-lowest rounded-lg border shadow-sm transition-shadow relative overflow-hidden ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-outline-variant"
      }`}
    >
      {/* Top Accent Line */}
      <div className="h-1 w-full bg-primary"></div>

      <div className="p-md">
        <div className="flex items-center gap-sm text-primary mb-xs">
          <Play className="w-[18px] h-[18px] fill-primary" />
          <span className="font-headline-sm text-[13px] font-bold text-on-surface truncate">
            {data.name || "Manual Trigger"}
          </span>
        </div>
        <p className="font-body-md text-[11px] text-on-surface-variant line-clamp-2">
          {data.configuration?.description || data.description || "Start the workflow execution manually."}
        </p>
      </div>

      <div className="px-md py-sm border-t border-outline-variant/30 bg-surface flex justify-end rounded-b-lg relative">
        <span className="font-label-sm text-[10px] text-on-surface-variant">Output</span>
        {/* React Flow Source Handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-3 !h-3 !bg-surface !border-2 !border-primary !rounded-full !absolute !-right-1.5 !top-1/2 !-translate-y-1/2 !cursor-crosshair"
        />
      </div>
    </div>
  );
}
