import { Handle, Position } from "@xyflow/react";
import { Globe } from "lucide-react";

interface HttpRequestNodeProps {
  data: {
    name?: string;
    configuration?: {
      method?: string;
      url?: string;
    };
  };
  selected?: boolean;
}

export default function HttpRequestNode({ data, selected }: HttpRequestNodeProps) {
  const method = data.configuration?.method || "GET";
  const url = data.configuration?.url || "https://api.example.com";

  return (
    <div
      className={`w-[240px] bg-surface-container-lowest rounded-lg border shadow-sm transition-shadow relative overflow-hidden ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-outline-variant hover:border-outline"
      }`}
    >
      {/* Top Accent Line (Action Nodes use tertiary theme) */}
      <div className="h-1 w-full bg-tertiary"></div>

      {/* React Flow Target Handle (Input on Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-surface !border-2 !border-outline !rounded-full !absolute !-left-1.5 !top-1/2 !-translate-y-1/2"
      />

      <div className="p-md">
        <div className="flex items-center gap-sm text-tertiary mb-xs">
          <Globe className="w-[18px] h-[18px]" />
          <span className="font-headline-sm text-[13px] font-bold text-on-surface truncate">
            {data.name || "HTTP Request"}
          </span>
        </div>

        <div className="flex items-center gap-xs mt-sm bg-surface-container rounded p-sm">
          <span className="font-label-sm text-[9px] bg-tertiary/10 text-tertiary px-1 rounded font-bold uppercase shrink-0">
            {method}
          </span>
          <span className="font-label-sm text-[10px] text-on-surface truncate flex-1" title={url}>
            {url}
          </span>
        </div>
      </div>

      <div className="px-md py-sm border-t border-outline-variant/30 bg-surface flex justify-end rounded-b-lg relative">
        <span className="font-label-sm text-[10px] text-on-surface-variant">Output</span>
        {/* React Flow Source Handle (Output on Right) */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-3 !h-3 !bg-surface !border-2 !border-tertiary !rounded-full !absolute !-right-1.5 !top-1/2 !-translate-y-1/2 !cursor-crosshair"
        />
      </div>
    </div>
  );
}
