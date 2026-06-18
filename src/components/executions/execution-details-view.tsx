"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Globe,
  GitBranch,
  Sparkles,
  Info,
  Terminal,
} from "lucide-react";

interface LogEntry {
  id: string;
  nodeId: string;
  status: "pending" | "running" | "success" | "failed";
  message: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

interface ExecutionData {
  id: string;
  workflowId: string;
  workflowVersionId: string;
  status: "pending" | "running" | "success" | "failed";
  startedAt: Date;
  finishedAt: Date | null;
  duration: number | null;
  workflow: {
    title: string;
    description: string | null;
  };
  version: {
    versionNumber: number;
  };
  logs: LogEntry[];
}

interface ExecutionDetailsViewProps {
  initialData: ExecutionData;
}

export function ExecutionDetailsView({ initialData }: ExecutionDetailsViewProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    initialData.logs.length > 0 ? initialData.logs[0].id : null
  );

  const selectedLog = initialData.logs.find((l) => l.id === selectedLogId);

  const formatDuration = (ms: number | null) => {
    if (ms === null || ms === undefined) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const parseLogMessage = (msg: string | null) => {
    if (!msg) return { message: "No log message available.", output: {} };
    try {
      return JSON.parse(msg);
    } catch (err) {
      return { message: msg, output: {} };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Activity className="w-3 h-3 animate-spin" />
            Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
            Pending
          </span>
        );
    }
  };

  // Helper to determine node icon by parsing payload or using standard types
  const getLogMeta = (log: LogEntry) => {
    // In our implementation, logs don't directly save node.type, but we can infer it
    // from parsed messages or default trigger/action/logic names.
    const parsed = parseLogMessage(log.message);
    const output = parsed.output || {};

    if (output.triggered !== undefined) {
      return { icon: Play, label: "Trigger", color: "text-primary bg-primary/10" };
    }
    if (output.branch !== undefined) {
      return { icon: GitBranch, label: "IF Logic", color: "text-secondary bg-secondary/10" };
    }
    if (output.prompt !== undefined) {
      return { icon: Sparkles, label: "AI Agent", color: "text-purple-600 bg-purple-100" };
    }
    return { icon: Globe, label: "HTTP Request", color: "text-tertiary bg-tertiary/10" };
  };

  return (
    <div className="flex flex-col gap-lg w-full max-w-6xl mx-auto p-md select-none">
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-md">
          <Link
            href="/executions"
            className="p-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-outline-variant mx-1"></div>
          <div>
            <div className="flex items-center gap-sm">
              <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {initialData.workflow.title}
              </h1>
              <span className="font-label-sm text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                Version {initialData.version.versionNumber}
              </span>
            </div>
            <p className="font-body-md text-[12px] text-on-surface-variant mt-xs">
              Execution ID: {initialData.id}
            </p>
          </div>
        </div>

        {/* Global Run Stats */}
        <div className="flex items-center gap-lg">
          <div className="flex items-center gap-xs text-[13px] text-on-surface-variant">
            <Calendar className="w-4 h-4" />
            <span>{new Date(initialData.startedAt).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-xs text-[13px] text-on-surface-variant font-mono">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(initialData.duration)}</span>
          </div>
          <div>{getStatusBadge(initialData.status)}</div>
        </div>
      </div>

      {/* Main Execution Split Panel */}
      <div className="flex flex-col md:flex-row gap-lg items-start min-h-[480px]">
        {/* Left Side: Timeline Steps Trace */}
        <div className="w-full md:w-1/2 flex flex-col gap-md">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
            Execution Steps
          </h3>
          <div className="flex flex-col relative pl-4 border-l border-outline-variant/50 ml-4 gap-md py-sm">
            {initialData.logs.map((log, index) => {
              const meta = getLogMeta(log);
              const LogIcon = meta.icon;
              const isSelected = log.id === selectedLogId;
              const stepIndex = index + 1;

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full p-md border rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-between relative bg-surface-container-lowest hover:border-primary/50 ${
                    isSelected ? "border-primary ring-2 ring-primary/10" : "border-outline-variant"
                  }`}
                >
                  {/* Visual timeline bullet */}
                  <div
                    className={`absolute -left-[25px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface border-outline-variant text-on-surface-variant"
                    }`}
                  >
                    {stepIndex}
                  </div>

                  <div className="flex items-center gap-md">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                      <LogIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-body-md text-[13px] font-semibold text-on-surface block">
                        Step {stepIndex}: {meta.label}
                      </span>
                      <span className="font-body-md text-[11px] text-on-surface-variant block mt-xs">
                        {log.finishedAt
                          ? `Completed in ${log.finishedAt.getTime() - new Date(log.startedAt).getTime()}ms`
                          : "Executing..."}
                      </span>
                    </div>
                  </div>

                  <div>
                    {log.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : log.status === "failed" ? (
                      <XCircle className="w-5 h-5 text-error" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step Inspector Logs Details */}
        <div className="w-full md:w-1/2 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm min-h-[440px] flex flex-col gap-md">
          {selectedLog ? (
            (() => {
              const meta = getLogMeta(selectedLog);
              const LogIcon = meta.icon;
              const parsed = parseLogMessage(selectedLog.message);
              const output = parsed.output || {};
              const msg = parsed.message || "";

              return (
                <>
                  <div className="flex items-center gap-sm">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                      <LogIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-[16px] font-bold text-on-surface">
                        {meta.label} Details
                      </h3>
                      <p className="font-body-md text-[11.5px] text-on-surface-variant">
                        Status: <strong className="capitalize">{selectedLog.status}</strong>
                      </p>
                    </div>
                  </div>

                  <hr className="border-outline-variant/30" />

                  {/* Summary Message */}
                  <div className="flex flex-col gap-xs">
                    <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                      Summary Message
                    </span>
                    <p className="font-body-md text-[13px] text-on-surface bg-surface-container p-sm rounded border border-outline-variant/30">
                      {msg}
                    </p>
                  </div>

                  {/* Dynamic output display based on node type */}
                  {output.triggered !== undefined && (
                    <div className="flex flex-col gap-xs">
                      <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                        Trigger Config
                      </span>
                      <p className="font-body-md text-[12px] text-on-surface-variant">
                        Trigger type: manual trigger execution. Description: {output.description || "Start workflow manually."}
                      </p>
                    </div>
                  )}

                  {output.status !== undefined && (
                    <div className="flex flex-col gap-md">
                      <div className="flex items-center gap-lg">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                            Response Status
                          </span>
                          <span className="font-semibold text-[13px] text-on-surface">
                            {output.status}
                          </span>
                        </div>
                        <div className="flex flex-col font-mono">
                          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                            Duration
                          </span>
                          <span className="text-[13px] text-on-surface">
                            {output.duration}ms
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-xs">
                        <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5" />
                          Output Body
                        </span>
                        <pre className="font-label-sm text-[11.5px] bg-slate-900 text-slate-100 rounded-lg p-sm overflow-x-auto border border-slate-800 max-h-56 max-w-full">
                          {typeof output.body === "object"
                            ? JSON.stringify(output.body, null, 2)
                            : String(output.body)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {output.branch !== undefined && (
                    <div className="flex flex-col gap-md">
                      <div className="flex items-center gap-lg">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                            Evaluated Condition
                          </span>
                          <span className="font-mono text-[12px] text-on-surface font-semibold">
                            {output.field} {output.operator} {output.expectedValue}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                            Branch Selected
                          </span>
                          <span className="font-bold text-[13px] text-primary capitalize">
                            {output.branch}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-xs">
                        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                          Preceding Node Output (Actual Value Resolved)
                        </span>
                        <p className="font-body-md text-[13px] text-on-surface font-mono bg-surface-container p-sm rounded border border-outline-variant/30">
                          {output.actualValue !== null ? String(output.actualValue) : "null / undefined"}
                        </p>
                      </div>
                    </div>
                  )}

                  {output.prompt !== undefined && (
                    <div className="flex flex-col gap-sm">
                      <div className="flex flex-col gap-xs">
                        <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                          Prompt Configured
                        </span>
                        <p className="font-body-md text-[13px] text-on-surface italic bg-surface-container p-sm rounded border border-outline-variant/30">
                          "{output.prompt}"
                        </p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Info className="w-8 h-8 text-outline mb-sm" />
              <p className="font-body-md text-[13px] text-on-surface-variant">
                Select a step on the left to inspect detailed log files.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
