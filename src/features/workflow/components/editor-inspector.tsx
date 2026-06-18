import React from "react";
import { Play, Globe, GitBranch, Sparkles, X, Info, Trash2, BoxSelect } from "lucide-react";

interface NodeData {
  name: string;
  configuration: any;
}

interface InspectorNode {
  id: string;
  type: string;
  data: NodeData;
}

interface EditorInspectorProps {
  node?: InspectorNode;
  edge?: any;
  selectedNodes?: any[];
  selectedEdges?: any[];
  onUpdateNode: (nodeId: string, updates: { name: string; configuration: any }) => void;
  onClose: () => void;
  onDelete?: () => void;
  onHoverItem?: (id: string | null) => void;
}

export default function EditorInspector({ node, edge, selectedNodes = [], selectedEdges = [], onUpdateNode, onClose, onDelete, onHoverItem }: EditorInspectorProps) {
  const totalSelected = selectedNodes.length + selectedEdges.length;
  if (totalSelected > 1) {
    return (
      <div className="w-80 h-full bg-surface border-l border-outline-variant flex flex-col z-10 shrink-0 select-none">
        <div className="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Multiple Selection</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
          <div className="flex flex-col items-center justify-center p-md bg-surface-container-lowest border border-outline-variant rounded-lg mb-sm">
             <BoxSelect className="w-8 h-8 text-primary mb-2" />
             <p className="font-label-md font-semibold text-on-surface">{totalSelected} items selected</p>
             <p className="font-body-md text-xs text-on-surface-variant text-center mt-1">
               Properties cannot be edited when multiple items are selected.
             </p>
          </div>
          
          {selectedNodes.length > 0 && (
            <div>
               <h4 className="font-label-sm font-semibold text-on-surface mb-2">Selected Nodes ({selectedNodes.length})</h4>
               <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                 {selectedNodes.map(n => (
                   <li 
                     key={n.id} 
                     className="text-xs bg-surface-container-lowest border border-outline-variant hover:border-primary/50 hover:bg-primary/5 cursor-default rounded px-2 py-1.5 truncate text-on-surface transition-colors"
                     onMouseEnter={() => onHoverItem?.(n.id)}
                     onMouseLeave={() => onHoverItem?.(null)}
                   >
                     {n.data?.name || "Unnamed Node"}
                   </li>
                 ))}
               </ul>
            </div>
          )}
          
          {selectedEdges.length > 0 && (
            <div>
               <h4 className="font-label-sm font-semibold text-on-surface mb-2 mt-2">Selected Connections ({selectedEdges.length})</h4>
               <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                 {selectedEdges.map(e => (
                   <li 
                     key={e.id} 
                     className="text-xs bg-surface-container-lowest border border-outline-variant hover:border-primary/50 hover:bg-primary/5 cursor-default rounded px-2 py-1.5 truncate text-on-surface font-mono transition-colors"
                     onMouseEnter={() => onHoverItem?.(e.id)}
                     onMouseLeave={() => onHoverItem?.(null)}
                   >
                     {e.id.substring(0, 12)}...
                   </li>
                 ))}
               </ul>
            </div>
          )}
        </div>
        
        {onDelete && (
          <div className="p-md border-t border-outline-variant/30 bg-surface-container/30 mt-auto">
            <button onClick={onDelete} className="w-full flex items-center justify-center gap-xs text-error hover:bg-error-container hover:text-on-error-container border border-error/30 py-2 rounded transition-colors font-label-md text-[13px]">
              <Trash2 className="w-4 h-4" /> Delete Selected
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!node && !edge) {
    return (
      <div className="w-80 h-full bg-surface border-l border-outline-variant flex flex-col z-10 shrink-0 select-none">
        <div className="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Properties</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-md text-center">
          <Info className="w-8 h-8 text-outline mb-sm" />
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Select a node on the canvas to view and edit its properties.
          </p>
        </div>
      </div>
    );
  }

  if (edge) {
    return (
      <div className="w-80 h-full bg-surface border-l border-outline-variant flex flex-col z-10 shrink-0 select-none">
        <div className="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Connection</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        <div className="flex-1 p-md flex flex-col gap-md">
           <div className="bg-surface-container-lowest border border-outline-variant rounded p-sm">
             <p className="font-body-md text-on-surface-variant text-[13px]">
               Edge ID: <span className="text-on-surface font-mono">{edge.id.substring(0, 8)}...</span>
             </p>
           </div>
        </div>
        {onDelete && (
          <div className="p-md border-t border-outline-variant/30 bg-surface-container/30 mt-auto">
            <button onClick={onDelete} className="w-full flex items-center justify-center gap-xs text-error hover:bg-error-container hover:text-on-error-container border border-error/30 py-2 rounded transition-colors font-label-md text-[13px]">
              <Trash2 className="w-4 h-4" /> Delete Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  // Handle node update cases when a node is definitely present
  if (!node) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(node.id, {
      name: e.target.value,
      configuration: { ...node.data.configuration },
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = {
      ...(node.data.configuration || {}),
      [key]: value,
    };
    onUpdateNode(node.id, {
      name: node.data.name,
      configuration: newConfig,
    });
  };

  // Helper to render type-specific icons/labels
  const getTypeMeta = () => {
    switch (node.type) {
      case "trigger":
        return {
          icon: Play,
          label: "TRIGGER NODE",
          iconColor: "text-primary bg-primary/10",
        };
      case "action":
        return {
          icon: Globe,
          label: "ACTION NODE",
          iconColor: "text-tertiary bg-tertiary/10",
        };
      case "logic":
        return {
          icon: GitBranch,
          label: "LOGIC NODE",
          iconColor: "text-secondary bg-secondary/10",
        };
      case "ai":
        return {
          icon: Sparkles,
          label: "AI NODE",
          iconColor: "text-purple-600 bg-purple-100",
        };
      default:
        return {
          icon: Info,
          label: "CUSTOM NODE",
          iconColor: "text-on-surface bg-surface-variant",
        };
    }
  };

  const meta = getTypeMeta();
  const Icon = meta.icon;

  const renderConfigFields = () => {
    const config = node.data.configuration || {};

    switch (node.type) {
      case "trigger":
        return (
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Trigger Description
              </label>
              <textarea
                value={config.description || "Start the workflow execution manually."}
                onChange={(e) => handleConfigChange("description", e.target.value)}
                rows={3}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
            <div className="p-sm rounded border border-primary-fixed bg-primary-fixed/15 mt-md">
              <div className="flex items-start gap-xs text-primary">
                <Info className="w-[16px] h-[16px] shrink-0 mt-0.5" />
                <p className="font-body-md text-[11px] text-on-surface-variant">
                  This trigger allows you to manually run the workflow from the dashboard or using the Run button above.
                </p>
              </div>
            </div>
          </div>
        );

      case "action":
        return (
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                HTTP Method
              </label>
              <div className="flex bg-surface-container rounded border border-outline-variant overflow-hidden">
                {["GET", "POST", "PUT", "DELETE"].map((method) => {
                  const isActive = (config.method || "GET") === method;
                  return (
                    <button
                      key={method}
                      onClick={() => handleConfigChange("method", method)}
                      className={`flex-1 py-1.5 font-label-sm text-[11px] transition-colors ${
                        isActive
                           ? "bg-tertiary text-on-tertiary font-bold"
                          : "text-on-surface-variant hover:bg-surface-variant/50"
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Request URL
              </label>
              <input
                type="text"
                value={config.url || "https://api.example.com"}
                onChange={(e) => handleConfigChange("url", e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://api.example.com"
              />
            </div>

            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Timeout (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={config.timeout !== undefined ? config.timeout : ""}
                onChange={(e) => handleConfigChange("timeout", e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="5 (default)"
              />
              <p className="font-body-md text-[10px] text-on-surface-variant">
                Enforce request timeout limit (1-60s).
              </p>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Retries (Attempts)
              </label>
              <input
                type="number"
                min={0}
                max={5}
                value={config.retries !== undefined ? config.retries : ""}
                onChange={(e) => handleConfigChange("retries", e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0 (default)"
              />
              <p className="font-body-md text-[10px] text-on-surface-variant">
                Max retries for transient HTTP errors (0-5).
              </p>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Retry Delay (ms)
              </label>
              <input
                type="number"
                min={100}
                max={10000}
                step={100}
                value={config.retryDelay !== undefined ? config.retryDelay : ""}
                onChange={(e) => handleConfigChange("retryDelay", e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1000 (default)"
              />
              <p className="font-body-md text-[10px] text-on-surface-variant">
                Delay between retry attempts in milliseconds.
              </p>
            </div>
          </div>
        );

      case "logic":
        return (
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Evaluation Field
              </label>
              <input
                type="text"
                value={config.field || "status"}
                onChange={(e) => handleConfigChange("field", e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. status"
              />
              <p className="font-body-md text-[11px] text-on-surface-variant">
                The property path in preceding outputs to evaluate.
              </p>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Operator
              </label>
              <select
                value={config.operator || "=="}
                onChange={(e) => handleConfigChange("operator", e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="==">Equals (==)</option>
                <option value="!=">Not Equals (!=)</option>
                <option value=">">Greater Than (&gt;)</option>
                <option value="<">Less Than (&lt;)</option>
                <option value="contains">Contains</option>
              </select>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Comparison Value
              </label>
              <input
                type="text"
                value={config.value || "completed"}
                onChange={(e) => handleConfigChange("value", e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="value to check"
              />
            </div>

            <div className="p-sm rounded border border-secondary bg-secondary-container/10 mt-md">
              <div className="flex items-start gap-xs text-secondary">
                <Info className="w-[16px] h-[16px] shrink-0 mt-0.5" />
                <div className="font-body-md text-[11px] text-on-surface-variant leading-relaxed">
                  Connect branches to <strong className="text-primary font-bold">True</strong> and <strong className="text-on-surface font-semibold">False</strong> handles to orchestrate flow direction.
                </div>
              </div>
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-[12px] font-semibold text-on-surface">
                Prompt Template
              </label>
              <textarea
                value={config.prompt || ""}
                onChange={(e) => handleConfigChange("prompt", e.target.value)}
                rows={4}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Write an email draft analyzing the data..."
              />
              <p className="font-body-md text-[11px] text-on-surface-variant">
                You can write text prompts here to configuration the AI response.
              </p>
            </div>

            <div className="p-sm rounded border border-purple-300 bg-purple-50 mt-md">
              <div className="flex items-start gap-xs text-purple-700">
                <Info className="w-[16px] h-[16px] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[11px] mb-xs uppercase">Coming Soon</h5>
                  <p className="font-body-md text-[11px] text-on-surface-variant leading-normal">
                    Execution of the AI prompt node is disabled for the MVP and will be implemented in a future update. Settings are persisted successfully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 h-full bg-surface border-l border-outline-variant flex flex-col z-10 shrink-0">
      {/* Inspector Header */}
      <div className="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
        <h3 className="font-headline-sm text-[16px] font-semibold text-on-surface">Properties</h3>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-lg select-none">
        {/* Node ID Header */}
        <div className="flex items-center gap-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.iconColor}`}>
            <Icon className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
              {meta.label}
            </div>
            <div className="font-body-md text-on-surface font-semibold truncate text-[14px]">
              {node.data.name}
            </div>
          </div>
        </div>

        <hr className="border-outline-variant/50" />

        {/* Node Name Fields */}
        <div className="flex flex-col gap-sm">
          <label className="font-label-md text-[12px] font-semibold text-on-surface">
            Node Label
          </label>
          <input
            type="text"
            value={node.data.name}
            onChange={handleNameChange}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-2 font-body-md text-[13px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
            placeholder="Name your node"
          />
        </div>

        {/* Type Specific Fields */}
        {renderConfigFields()}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-outline-variant/30 bg-surface-container/30 flex flex-col mt-auto">
        {onDelete && (
          <div className="p-sm border-b border-outline-variant/30">
            <button onClick={onDelete} className="w-full flex items-center justify-center gap-xs text-error hover:bg-error-container hover:text-on-error-container border border-error/30 py-2 rounded transition-colors font-label-md text-[13px]">
              <Trash2 className="w-[14px] h-[14px]" /> Delete Node
            </button>
          </div>
        )}
        <div className="p-sm flex items-center justify-center gap-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-label-sm text-[9.5px] text-on-surface-variant font-medium">
            Changes will auto-save in 3s
          </span>
        </div>
      </div>
    </div>
  );
}
