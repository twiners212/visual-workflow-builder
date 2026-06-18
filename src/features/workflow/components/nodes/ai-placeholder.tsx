import { Handle, Position } from "@xyflow/react";
import { Sparkles } from "lucide-react";

interface AiPlaceholderNodeProps {
  data: {
    name?: string;
    configuration?: {
      prompt?: string;
    };
  };
  selected?: boolean;
}

export default function AiPlaceholderNode({ data, selected }: AiPlaceholderNodeProps) {
  const prompt = data.configuration?.prompt || "Write an email draft analyzing the data...";

  return (
    <div
      className={`w-[240px] bg-surface-container-lowest rounded-lg border shadow-sm transition-shadow relative overflow-hidden ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-outline-variant hover:border-outline"
      }`}
    >
      {/* Top Accent Line (AI Node uses purple color/accent gradient) */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-600"></div>

      {/* React Flow Target Handle (Input on Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-surface !border-2 !border-outline !rounded-full !absolute !-left-1.5 !top-1/2 !-translate-y-1/2"
      />

      <div className="p-md">
        <div className="flex items-center justify-between mb-xs">
          <div className="flex items-center gap-sm text-purple-600 dark:text-purple-400">
            <Sparkles className="w-[18px] h-[18px] fill-purple-100 dark:fill-purple-950/60" />
            <span className="font-headline-sm text-[13px] font-bold text-on-surface truncate">
              {data.name || "AI Agent Prompt"}
            </span>
          </div>
          <span className="font-label-sm text-[9px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1 rounded font-bold shrink-0">
            AI
          </span>
        </div>

        <div className="bg-surface-container rounded p-sm mt-sm">
          <p className="font-label-sm text-[10px] text-on-surface-variant line-clamp-2 italic">
            &quot;{prompt}&quot;
          </p>
        </div>
      </div>

      <div className="px-md py-sm border-t border-outline-variant/30 bg-surface flex justify-between items-center rounded-b-lg relative">
        <span className="font-label-sm text-[9px] text-on-surface-variant italic">Execution (Coming Soon)</span>
        <span className="font-label-sm text-[10px] text-on-surface-variant">Output</span>
        {/* React Flow Source Handle (Output on Right) */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-3 !h-3 !bg-surface !border-2 !border-purple-600 dark:!border-purple-400 !rounded-full !absolute !-right-1.5 !top-1/2 !-translate-y-1/2 !cursor-crosshair"
        />
      </div>
    </div>
  );
}
