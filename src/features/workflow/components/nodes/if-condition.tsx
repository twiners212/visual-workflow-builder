import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

interface IfConditionNodeProps {
  data: {
    name?: string;
    configuration?: {
      field?: string;
      operator?: string;
      value?: string;
    };
  };
  selected?: boolean;
}

export default function IfConditionNode({ data, selected }: IfConditionNodeProps) {
  const field = data.configuration?.field || "status";
  const operator = data.configuration?.operator || "==";
  const value = data.configuration?.value || "completed";

  return (
    <div
      className={`w-[240px] bg-surface-container-lowest rounded-lg border shadow-sm transition-shadow relative overflow-hidden ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-outline-variant hover:border-outline"
      }`}
    >
      {/* Top Accent Line (Logic Nodes use secondary/grey/outline color) */}
      <div className="h-1 w-full bg-secondary"></div>

      {/* React Flow Target Handle (Input on Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-surface !border-2 !border-outline !rounded-full !absolute !-left-1.5 !top-1/2 !-translate-y-1/2"
      />

      <div className="p-md">
        <div className="flex items-center gap-sm text-secondary mb-xs">
          <GitBranch className="w-[18px] h-[18px]" />
          <span className="font-headline-sm text-[13px] font-bold text-on-surface truncate">
            {data.name || "IF Condition"}
          </span>
        </div>

        <div className="bg-surface-container rounded p-sm mt-sm flex items-center justify-between">
          <span className="font-label-sm text-[10px] text-on-surface truncate font-semibold">
            {field}
          </span>
          <span className="font-label-sm text-[10px] text-on-surface-variant font-bold px-1 uppercase shrink-0">
            {operator}
          </span>
          <span className="font-label-sm text-[10px] text-on-surface truncate font-semibold">
            {value}
          </span>
        </div>
      </div>

      {/* Two Output Handles: True and False */}
      <div className="h-14 border-t border-outline-variant/30 bg-surface relative flex flex-col justify-around px-md">
        {/* True Output Row */}
        <div className="flex justify-between items-center relative h-1/2">
          <span className="font-label-sm text-[10px] text-primary font-bold">True</span>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "25%" }}
            className="!w-3 !h-3 !bg-surface !border-2 !border-primary !rounded-full !absolute !-right-1.5 !cursor-crosshair"
          />
        </div>

        {/* False Output Row */}
        <div className="flex justify-between items-center relative h-1/2">
          <span className="font-label-sm text-[10px] text-on-surface-variant">False</span>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "75%" }}
            className="!w-3 !h-3 !bg-surface !border-2 !border-outline !rounded-full !absolute !-right-1.5 !cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
}
