"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  TrendingUp,
  CheckCircle,
  MoreHorizontal,
  Star,
  Trash2,
  Edit2,
  X,
  Loader2,
  FolderOpen
} from "lucide-react";
import {
  createWorkflowAction,
  renameWorkflowAction,
  deleteWorkflowAction,
  toggleFavoriteAction
} from "@/features/workflow/server/actions";

interface Workflow {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  currentVersionId: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  versions?: any[];
}

interface DashboardViewProps {
  initialWorkflows: any[];
}

export function DashboardView({ initialWorkflows }: DashboardViewProps) {
  const router = useRouter();
  const [workflowsList, setWorkflowsList] = useState<Workflow[]>(initialWorkflows as any);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Dropdown States
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filter workflows based on search
  const filteredWorkflows = workflowsList.filter((w) =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    startTransition(async () => {
      const res = await createWorkflowAction(createTitle, createDesc);
      if (res.success && res.data) {
        // Optimistically update list
        const newW = {
          ...res.data.workflow,
          versions: [res.data.version]
        };
        setWorkflowsList([newW as any, ...workflowsList]);
        setIsCreateOpen(false);
        setCreateTitle("");
        setCreateDesc("");
        router.push(`/workflows/${res.data.workflow.id}`);
      } else {
        alert(res.error || "Failed to create workflow");
      }
    });
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !renameTitle.trim()) return;

    startTransition(async () => {
      const res = await renameWorkflowAction(selectedWorkflow.id, renameTitle);
      if (res.success && res.data) {
        setWorkflowsList(
          workflowsList.map((w) =>
            w.id === selectedWorkflow.id ? { ...w, title: renameTitle } : w
          )
        );
        setIsRenameOpen(false);
        setSelectedWorkflow(null);
        setRenameTitle("");
      } else {
        alert(res.error || "Failed to rename workflow");
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedWorkflow) return;

    startTransition(async () => {
      const res = await deleteWorkflowAction(selectedWorkflow.id);
      if (res.success) {
        setWorkflowsList(workflowsList.filter((w) => w.id !== selectedWorkflow.id));
        setIsDeleteOpen(false);
        setSelectedWorkflow(null);
      } else {
        alert(res.error || "Failed to delete workflow");
      }
    });
  };

  const handleToggleFavorite = async (workflowId: string) => {
    startTransition(async () => {
      const res = await toggleFavoriteAction(workflowId);
      if (res.success && res.data) {
        setWorkflowsList(
          workflowsList.map((w) =>
            w.id === workflowId ? { ...w, isFavorite: res.data.isFavorite } : w
          )
        );
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-lg relative">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
            Dashboard
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage and monitor your active workflow orchestrations.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-on-primary px-md py-sm rounded hover:bg-primary-container transition-colors flex items-center gap-sm font-body-md text-body-md shadow-sm active:opacity-80"
        >
          <Plus className="w-[18px] h-[18px]" />
          New Workflow
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-sm">
            Total Executions (24h)
          </div>
          <div className="font-headline-lg text-headline-lg text-on-surface">
            0
          </div>
          <div className="text-tertiary-container font-label-sm text-label-sm mt-sm flex items-center gap-xs">
            <TrendingUp className="w-[12px] h-[12px]" /> +0.0% vs yesterday
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-sm">
            Active Workflows
          </div>
          <div className="font-headline-lg text-headline-lg text-on-surface">
            {workflowsList.filter((w) => w.currentVersionId).length}
          </div>
          <div className="text-on-surface-variant font-label-sm text-label-sm mt-sm">
            Across 1 environment
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-sm">
            Error Rate
          </div>
          <div className="font-headline-lg text-headline-lg text-on-surface">
            0.00%
          </div>
          <div className="text-primary font-label-sm text-label-sm mt-sm flex items-center gap-xs">
            <CheckCircle className="w-[12px] h-[12px]" /> Healthy status
          </div>
        </div>
      </div>

      {/* Filter and Content */}
      <div className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Recent Workflows
          </h3>
          {/* Search bar inside content */}
          <div className="relative w-64">
            <Search className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input
              className="pl-[32px] pr-sm py-sm rounded-full bg-surface-container-lowest border border-outline-variant text-body-md font-body-md focus:ring-2 focus:ring-primary focus:outline-none w-full text-on-surface placeholder:text-on-surface-variant/40"
              placeholder="Search workflows..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredWorkflows.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-xl flex flex-col items-center justify-center text-center gap-md py-[64px]">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">
                No workflows found
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs max-w-sm">
                Create a new automation workflow visually to get started with building nodes.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-on-primary px-md py-sm rounded hover:bg-primary-container transition-colors flex items-center gap-xs font-body-md text-body-md shadow-sm active:opacity-80"
            >
              <Plus className="w-[18px] h-[18px]" />
              New Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {filteredWorkflows.map((w) => {
              const hasPublished = !!w.currentVersionId;
              return (
                <div
                  key={w.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between group h-[220px]"
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${
                      hasPublished ? "bg-primary" : "bg-outline-variant"
                    }`}
                  ></div>

                  <div className="flex justify-between items-start mb-md">
                    <div className="flex-1 min-w-0 pr-md">
                      <Link href={`/workflows/${w.id}`} className="hover:underline block">
                        <h4 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors truncate">
                          {w.title}
                        </h4>
                      </Link>
                      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mt-xs">
                        {w.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex items-center gap-xs">
                      <button
                        onClick={() => handleToggleFavorite(w.id)}
                        className="text-on-surface-variant hover:text-primary transition-colors p-xs"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            w.isFavorite
                              ? "fill-primary text-primary"
                              : "text-on-surface-variant/40"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-label-sm ${
                          hasPublished
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {hasPublished ? "Active" : "Draft"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-sm mb-md">
                    <div className="bg-surface-container p-sm rounded">
                      <div className="text-[10px] text-on-surface-variant font-label-sm uppercase tracking-wider mb-xs">
                        Last Updated
                      </div>
                      <div className="font-label-md text-label-md text-on-surface">
                        {new Date(w.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-surface-container p-sm rounded">
                      <div className="text-[10px] text-on-surface-variant font-label-sm uppercase tracking-wider mb-xs">
                        Versions
                      </div>
                      <div className="font-label-md text-label-md text-on-surface">
                        {w.versions?.length || 1}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-sm border-t border-outline-variant mt-auto relative">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary-container border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                        DB
                      </div>
                      <div className="w-6 h-6 rounded-full bg-tertiary-container border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-on-tertiary-container">
                        API
                      </div>
                    </div>

                    {/* Action Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(activeDropdown === w.id ? null : w.id)
                        }
                        className="text-on-surface-variant hover:text-primary p-xs rounded hover:bg-surface-container transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {activeDropdown === w.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveDropdown(null)}
                          ></div>
                          <div className="absolute right-0 bottom-full mb-xs bg-surface-container-lowest border border-outline-variant rounded shadow-md z-40 w-36 py-xs">
                            <button
                              onClick={() => {
                                setSelectedWorkflow(w);
                                setRenameTitle(w.title);
                                setIsRenameOpen(true);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-md py-sm text-body-md hover:bg-surface-container transition-colors flex items-center gap-sm"
                            >
                              <Edit2 className="w-4 h-4" /> Rename
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWorkflow(w);
                                setIsDeleteOpen(true);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-md py-sm text-body-md hover:bg-error-container text-error hover:text-on-error-container transition-colors flex items-center gap-sm"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- CREATE WORKFLOW DIALOG --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Create New Workflow
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-on-surface-variant hover:text-primary p-xs rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-lg space-y-md">
                <div className="flex flex-col gap-xs">
                  <label
                    className="font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="create-title"
                  >
                    Workflow Title
                  </label>
                  <input
                    id="create-title"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-on-surface-variant/30"
                    placeholder="e.g. Sync Stripe Transactions"
                    required
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label
                    className="font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="create-desc"
                  >
                    Description
                  </label>
                  <textarea
                    id="create-desc"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-on-surface-variant/30 h-24 resize-none"
                    placeholder="Briefly describe what this automation accomplishes..."
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="px-lg py-md border-t border-outline-variant bg-surface flex justify-end gap-sm">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-md py-sm border border-outline rounded hover:bg-surface-container-high transition-colors font-body-md text-body-md text-on-surface"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-on-primary px-md py-sm rounded hover:bg-primary-container transition-colors font-body-md text-body-md flex items-center gap-xs shadow-sm"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RENAME WORKFLOW DIALOG --- */}
      {isRenameOpen && selectedWorkflow && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Rename Workflow
              </h3>
              <button
                onClick={() => setIsRenameOpen(false)}
                className="text-on-surface-variant hover:text-primary p-xs rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRename}>
              <div className="p-lg">
                <div className="flex flex-col gap-xs">
                  <label
                    className="font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="rename-title"
                  >
                    Workflow Title
                  </label>
                  <input
                    id="rename-title"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-on-surface-variant/30"
                    required
                    type="text"
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="px-lg py-md border-t border-outline-variant bg-surface flex justify-end gap-sm">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className="px-md py-sm border border-outline rounded hover:bg-surface-container-high transition-colors font-body-md text-body-md text-on-surface"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-on-primary px-md py-sm rounded hover:bg-primary-container transition-colors font-body-md text-body-md flex items-center gap-xs shadow-sm"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {isDeleteOpen && selectedWorkflow && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs flex items-center justify-center z-50 p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-error">
                Delete Workflow
              </h3>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="text-on-surface-variant hover:text-primary p-xs rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-lg space-y-sm">
              <p className="font-body-md text-body-md text-on-surface">
                Are you sure you want to delete <span className="font-semibold">{selectedWorkflow.title}</span>?
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                This action is permanent and will delete all associated versions, canvas nodes, edges, and execution history.
              </p>
            </div>
            <div className="px-lg py-md border-t border-outline-variant bg-surface flex justify-end gap-sm">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-md py-sm border border-outline rounded hover:bg-surface-container-high transition-colors font-body-md text-body-md text-on-surface"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-error text-on-error px-md py-sm rounded hover:opacity-90 transition-colors font-body-md text-body-md flex items-center gap-xs shadow-sm"
                disabled={isPending}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
