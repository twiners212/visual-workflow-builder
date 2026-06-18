import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, FileJson, X, Copy, CopyPlus } from "lucide-react";
import { Node, Edge } from "@xyflow/react";

export type ImportPreviewState = {
  name: string;
  version: number;
  nodes: Node[];
  edges: Edge[];
  originalNodeCount: number;
  originalEdgeCount: number;
  warnings: string[];
  criticalErrors: string[];
};

interface ImportDialogProps {
  preview: ImportPreviewState | null;
  onCancel: () => void;
  onConfirm: (mode: "replace" | "merge", nodes: Node[], edges: Edge[], title?: string) => void;
}

export const ImportDialog = ({ preview, onCancel, onConfirm }: ImportDialogProps) => {
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");

  if (!preview) return null;

  const hasCriticalErrors = preview.criticalErrors.length > 0;

  const handleConfirm = () => {
    if (hasCriticalErrors) return;
    onConfirm(importMode, preview.nodes, preview.edges, preview.name);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-surface-container rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileJson className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-label-lg font-semibold text-on-surface">Import Workflow</h2>
              <p className="text-xs text-on-surface-variant font-body-sm">Preview and validate data</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
          
          {/* Metadata Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-outline-variant/50 bg-surface-variant/30 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Workflow Name</span>
              <span className="font-body-md text-sm text-on-surface truncate">{preview.name || "Untitled"}</span>
            </div>
            <div className="p-3 rounded-xl border border-outline-variant/50 bg-surface-variant/30 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Schema Version</span>
              <span className="font-body-md text-sm text-on-surface">v{preview.version}</span>
            </div>
            <div className="p-3 rounded-xl border border-outline-variant/50 bg-surface-variant/30 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Valid Nodes</span>
              <span className="font-body-md text-sm text-on-surface">
                {preview.nodes.length} <span className="text-on-surface-variant/50 text-xs">(of {preview.originalNodeCount})</span>
              </span>
            </div>
            <div className="p-3 rounded-xl border border-outline-variant/50 bg-surface-variant/30 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Valid Edges</span>
              <span className="font-body-md text-sm text-on-surface">
                {preview.edges.length} <span className="text-on-surface-variant/50 text-xs">(of {preview.originalEdgeCount})</span>
              </span>
            </div>
          </div>

          {/* Errors / Warnings */}
          {hasCriticalErrors && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-error/10 border border-error/20">
              <div className="flex items-center gap-2 text-error font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Validation Errors</span>
              </div>
              <ul className="list-disc list-inside text-xs text-error/80 flex flex-col gap-1 pl-1">
                {preview.criticalErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {!hasCriticalErrors && preview.warnings.length > 0 && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Sanitization Warnings</span>
              </div>
              <ul className="list-disc list-inside text-xs text-warning/80 flex flex-col gap-1 pl-1">
                {preview.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {!hasCriticalErrors && preview.warnings.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>File validation passed successfully.</span>
            </div>
          )}

          {/* Import Mode Selection */}
          {!hasCriticalErrors && (
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider">Import Mode</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setImportMode("replace")}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                    importMode === "replace" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                      : "border-outline-variant hover:bg-surface-variant/50"
                  }`}
                >
                  <div className="flex items-center gap-2 font-label-md text-sm text-on-surface">
                    <Copy className={`w-4 h-4 ${importMode === "replace" ? "text-primary" : "text-on-surface-variant"}`} />
                    Replace Current
                  </div>
                  <span className="text-[10px] text-on-surface-variant leading-tight">
                    Clears the current board and overwrites the title.
                  </span>
                </button>
                <button
                  onClick={() => setImportMode("merge")}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                    importMode === "merge" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                      : "border-outline-variant hover:bg-surface-variant/50"
                  }`}
                >
                  <div className="flex items-center gap-2 font-label-md text-sm text-on-surface">
                    <CopyPlus className={`w-4 h-4 ${importMode === "merge" ? "text-primary" : "text-on-surface-variant"}`} />
                    Merge
                  </div>
                  <span className="text-[10px] text-on-surface-variant leading-tight">
                    Appends nodes to the current board and keeps current title.
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/50 flex items-center justify-end gap-3 bg-surface-variant/20">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-label-md text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={hasCriticalErrors}
            className="px-4 py-2 rounded-lg font-label-md text-sm bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {hasCriticalErrors ? "Cannot Import" : importMode === "replace" ? "Replace Workflow" : "Merge Workflow"}
          </button>
        </div>
      </div>
    </div>
  );
};
