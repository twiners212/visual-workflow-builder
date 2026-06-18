"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  ReactFlowProvider,
  SelectionMode,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronLeft, Play, Rocket, Loader2, CheckCircle2, AlertCircle, Trash2, BoxSelect, Hand, Maximize, Keyboard, Download, Upload, Pencil, X, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NodeLibrary from "./node-library";
import EditorInspector from "./editor-inspector";
import ManualTriggerNode from "./nodes/manual-trigger";
import HttpRequestNode from "./nodes/http-request";
import IfConditionNode from "./nodes/if-condition";
import AiPlaceholderNode from "./nodes/ai-placeholder";
import { UnknownNode } from "./nodes/unknown-node";
import { ImportDialog, ImportPreviewState } from "./import-dialog";
import { saveDraftAction, publishDraftAction, renameWorkflowAction } from "../server/actions";
import { executeWorkflowAction } from "@/features/execution/server/actions";
import { updatePreferencesAction } from "@/features/settings/server/actions";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";


// Define custom node types outside the component to prevent re-renders
const nodeTypes = {
  trigger: ManualTriggerNode,
  action: HttpRequestNode,
  logic: IfConditionNode,
  ai: AiPlaceholderNode,
  unknown: UnknownNode,
};

interface EditorCanvasProps {
  workflowId: string;
  versionId: string;
  workflowTitle: string;
  initialNodes: any[];
  initialEdges: any[];
  userPreferences?: any;
}

function EditorCanvasContent({
  workflowId,
  versionId,
  workflowTitle,
  initialNodes,
  initialEdges,
  userPreferences,
}: EditorCanvasProps) {
  const [preferences, setPreferences] = useState(userPreferences || {});
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const canvasPrefs = useMemo(() => {
    return {
      showGrid: preferences?.canvas?.showGrid !== false,
      snapToGrid: !!preferences?.canvas?.snapToGrid,
      showMinimap: preferences?.canvas?.showMinimap !== false,
      enableAnimations: preferences?.canvas?.enableAnimations !== false,
      defaultZoom: preferences?.workflow?.defaultZoom || 1,
      enableKeyboardShortcuts: preferences?.editor?.enableKeyboardShortcuts !== false,
    };
  }, [preferences]);

  const handleUpdatePreference = async (key: string, subKey: string | null, value: any) => {
    // Deep clone to ensure React state updates and useMemo triggers correctly
    const newPrefs = JSON.parse(JSON.stringify(preferences || {}));
    if (subKey) {
      if (!newPrefs[key]) newPrefs[key] = {};
      newPrefs[key][subKey] = value;
    } else {
      newPrefs[key] = value;
    }
    setPreferences(newPrefs);
    
    // Save to database
    try {
      await updatePreferencesAction(newPrefs);
    } catch (e) {
      console.error("Failed to save preference", e);
    }
  };
  const router = useRouter();
  const { screenToFlowPosition, deleteElements, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [elementsToDelete, setElementsToDelete] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [interactionMode, setInteractionMode] = useState<"marquee" | "pan">("marquee");
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Advanced features state
  const [past, setPast] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);
  const [title, setTitle] = useState(workflowTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const nodesRef = useRef<Node[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);
  const selectedNodeIdRef = useRef<string | null>(null);
  const clipboardRef = useRef<Node[] | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  // Compute highlighted nodes and edges
  const displayNodes = useMemo(() => {
    if (!hoveredItemId) return nodes;
    return nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: n.id !== hoveredItemId ? 0.3 : 1,
        transition: 'opacity 0.2s ease-in-out',
        zIndex: n.id === hoveredItemId ? 1000 : (n.style?.zIndex || 0)
      },
      className: n.id === hoveredItemId ? (n.className ? `${n.className} !ring-4 !ring-primary !rounded-lg` : '!ring-4 !ring-primary !rounded-lg') : n.className
    }));
  }, [nodes, hoveredItemId]);

  const displayEdges = useMemo(() => {
    if (!hoveredItemId) {
      return edges.map(e => ({
        ...e,
        animated: canvasPrefs.enableAnimations ? e.animated : false,
      }));
    }
    return edges.map(e => ({
      ...e,
      style: {
        ...e.style,
        opacity: e.id !== hoveredItemId ? 0.15 : 1,
        strokeWidth: e.id === hoveredItemId ? 4 : (e.style?.strokeWidth || 2),
        transition: 'opacity 0.2s ease-in-out'
      },
      animated: e.id === hoveredItemId ? true : (canvasPrefs.enableAnimations ? e.animated : false),
      zIndex: e.id === hoveredItemId ? 1000 : (e.zIndex || 0)
    }));
  }, [edges, hoveredItemId, canvasPrefs.enableAnimations]);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const toast = useToast();

  const isFirstMount = useRef(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const activeSaveTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Track selection for the Inspector sidebar
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // Auto-save logic (3-second debounce)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const inputNodes = nodes.map((n) => ({
          id: n.id,
          type: (n.type || "action") as "trigger" | "action" | "logic" | "ai",
          name: (n.data?.name || "Node") as string,
          positionX: n.position.x,
          positionY: n.position.y,
          configuration: n.data?.configuration || {},
        }));

        const inputEdges = edges.map((e) => ({
          id: e.id,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          label: e.label as string | undefined,
        }));

        const res = await saveDraftAction(versionId, inputNodes, inputEdges);
        if (res.success) {
          setSaveStatus("saved");
          setErrorMessage(null);
        } else {
          setSaveStatus("unsaved");
          setErrorMessage(res.error || "Auto-save failed");
        }
      } catch (err: any) {
        console.error("Auto-save error:", err);
        setSaveStatus("unsaved");
        setErrorMessage(err.message || "Auto-save connection failed");
      }
    }, 3000);

    activeSaveTimeoutRef.current = timer;

    return () => clearTimeout(timer);
  }, [nodes, edges, versionId]);

  // Instant save logic
  const handleInstantSave = useCallback(async () => {
    if (activeSaveTimeoutRef.current) {
      clearTimeout(activeSaveTimeoutRef.current);
      activeSaveTimeoutRef.current = null;
    }

    setSaveStatus("saving");
    try {
      const inputNodes = nodes.map((n) => ({
        id: n.id,
        type: (n.type || "action") as "trigger" | "action" | "logic" | "ai",
        name: (n.data?.name || "Node") as string,
        positionX: n.position.x,
        positionY: n.position.y,
        configuration: n.data?.configuration || {},
      }));

      const inputEdges = edges.map((e) => ({
        id: e.id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        label: e.label as string | undefined,
      }));

      const res = await saveDraftAction(versionId, inputNodes, inputEdges);
      if (res.success) {
        setSaveStatus("saved");
        setErrorMessage(null);
        toast.success("Draft saved successfully!");
      } else {
        setSaveStatus("unsaved");
        setErrorMessage(res.error || "Save failed");
        toast.error(res.error || "Failed to save draft");
      }
    } catch (err: any) {
      console.error("Instant save error:", err);
      setSaveStatus("unsaved");
      setErrorMessage(err.message || "Save connection failed");
      toast.error(err.message || "Draft save failed due to connection error");
    }
  }, [nodes, edges, versionId, toast]);

  // Undo / Redo snapshots
  const takeSnapshot = useCallback(() => {
    setPast((prev) => {
      const newPast = [...prev, { nodes: nodesRef.current, edges: edgesRef.current }];
      if (newPast.length > 50) {
        newPast.shift();
      }
      return newPast;
    });
    setFuture([]);
  }, []);

  const activeEditTimerRef = useRef<any>(null);
  const hasActiveEditSessionRef = useRef(false);

  const takeEditSnapshot = useCallback(() => {
    if (!hasActiveEditSessionRef.current) {
      takeSnapshot();
      hasActiveEditSessionRef.current = true;
    }
    if (activeEditTimerRef.current) {
      clearTimeout(activeEditTimerRef.current);
    }
    activeEditTimerRef.current = setTimeout(() => {
      hasActiveEditSessionRef.current = false;
    }, 1500);
  }, [takeSnapshot]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prev) => [...prev, { nodes, edges }]);

    nodesRef.current = previous.nodes;
    edgesRef.current = previous.edges;
    setNodes(previous.nodes);
    setEdges(previous.edges);

    // Broadcast the full update to other collaborators
    channelRef.current?.send({
      type: "broadcast",
      event: "sync-all",
      payload: {
        nodes: previous.nodes,
        edges: previous.edges,
      },
    });

    toast.success("Undo action");
  }, [past, nodes, edges, setNodes, setEdges, toast]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const newFuture = future.slice(0, future.length - 1);

    setFuture(newFuture);
    setPast((prev) => [...prev, { nodes, edges }]);

    nodesRef.current = next.nodes;
    edgesRef.current = next.edges;
    setNodes(next.nodes);
    setEdges(next.edges);

    // Broadcast the full update to other collaborators
    channelRef.current?.send({
      type: "broadcast",
      event: "sync-all",
      payload: {
        nodes: next.nodes,
        edges: next.edges,
      },
    });

    toast.success("Redo action");
  }, [future, nodes, edges, setNodes, setEdges, toast]);

  // Copy / Paste
  const handleCopy = useCallback(() => {
    const selectedNodes = nodesRef.current.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    clipboardRef.current = selectedNodes;
    toast.success(`Copied ${selectedNodes.length} node(s)`);
  }, [toast]);

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.length === 0) return;

    takeSnapshot();

    const newNodes = clipboardRef.current.map((node) => {
      const newId = `node_${crypto.randomUUID()}`;
      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },
      };
    });

    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: false })).concat(newNodes)
    );

    newNodes.forEach((node) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "node-change",
        payload: {
          changeType: "add",
          data: { node },
        },
      });
    });

    toast.success(`Pasted ${newNodes.length} node(s)`);
  }, [takeSnapshot, setNodes, toast]);

  // Title Save
  const handleTitleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitle(workflowTitle);
      setIsEditingTitle(false);
      return;
    }

    if (trimmedTitle === workflowTitle) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const res = await renameWorkflowAction(workflowId, trimmedTitle);
      if (res.success) {
        toast.success("Workflow renamed successfully!");
        setIsEditingTitle(false);
      } else {
        toast.error(res.error || "Failed to rename workflow");
        setTitle(workflowTitle);
        setIsEditingTitle(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to rename workflow");
      setTitle(workflowTitle);
      setIsEditingTitle(false);
    }
  };

  // Handle Export to JSON
  const handleExportJSON = useCallback(() => {
    try {
      const exportData = {
        name: title,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: e.label,
          data: e.data,
        })),
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_workflow.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Workflow exported successfully!");
    } catch (err: any) {
      toast.error("Failed to export workflow: " + err.message);
    }
  }, [nodes, edges, title, toast]);

  // Handle Import from JSON
  const handleImportJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json || typeof json !== "object") {
          throw new Error("Invalid file format. Must be a JSON object.");
        }

        const rawNodes = Array.isArray(json.nodes) ? json.nodes : [];
        const rawEdges = Array.isArray(json.edges) ? json.edges : [];
        const originalNodeCount = rawNodes.length;
        const originalEdgeCount = rawEdges.length;

        const warnings: string[] = [];
        const criticalErrors: string[] = [];

        if (originalNodeCount === 0 && originalEdgeCount === 0) {
          criticalErrors.push("The imported file contains no nodes or edges.");
        }

        // Validate Nodes
        const validNodeIds = new Set<string>();
        const validNodes: Node[] = [];

        rawNodes.forEach((n: any, index: number) => {
          if (!n || typeof n !== "object") {
            warnings.push(`Skipped invalid node at index ${index} (not an object)`);
            return;
          }
          if (!n.id || typeof n.id !== "string") {
            warnings.push(`Skipped node at index ${index} (missing or invalid 'id')`);
            return;
          }
          if (!n.position || typeof n.position !== "object" || typeof n.position.x !== "number" || typeof n.position.y !== "number") {
            warnings.push(`Skipped node '${n.id}' (missing or invalid 'position')`);
            return;
          }

          let nodeType = n.type || "action";
          const isUnknown = !(nodeType in nodeTypes);
          if (isUnknown) {
            warnings.push(`Node '${n.id}' has unknown type '${nodeType}'. It will be imported as a placeholder.`);
          }

          validNodes.push({
            id: n.id,
            type: isUnknown ? "unknown" : nodeType,
            position: { x: n.position.x, y: n.position.y },
            data: {
              ...(n.data || {}),
              ...(isUnknown ? { originalType: nodeType } : {})
            },
          });
          validNodeIds.add(n.id);
        });

        // Validate Edges
        const validEdges: Edge[] = [];
        rawEdges.forEach((e: any, index: number) => {
          if (!e || typeof e !== "object") {
            warnings.push(`Skipped invalid edge at index ${index} (not an object)`);
            return;
          }
          if (!e.id || typeof e.id !== "string") {
            warnings.push(`Skipped edge at index ${index} (missing or invalid 'id')`);
            return;
          }
          if (!e.source || typeof e.source !== "string" || !validNodeIds.has(e.source)) {
            warnings.push(`Skipped edge '${e.id}' (invalid source or source node not found)`);
            return;
          }
          if (!e.target || typeof e.target !== "string" || !validNodeIds.has(e.target)) {
            warnings.push(`Skipped edge '${e.id}' (invalid target or target node not found)`);
            return;
          }

          validEdges.push({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            label: e.label,
            data: e.data || {},
          });
        });

        setImportPreview({
          name: json.name || file.name.replace(/\.json$/, ""),
          version: json.version || 1,
          nodes: validNodes,
          edges: validEdges,
          originalNodeCount,
          originalEdgeCount,
          warnings,
          criticalErrors
        });

      } catch (err: any) {
        toast.error("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }, [toast]);

  const handleConfirmImport = useCallback((mode: "replace" | "merge", importedNodes: Node[], importedEdges: Edge[], importedTitle?: string) => {
    takeSnapshot();

    let finalNodes = [...importedNodes];
    let finalEdges = [...importedEdges];

    if (mode === "merge") {
      const idMap = new Map<string, string>();
      const OFFSET_X = 100;
      const OFFSET_Y = 100;

      // Regenerate IDs and offset positions
      finalNodes = importedNodes.map((n) => {
        const newId = `node_${crypto.randomUUID()}`;
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          position: {
            x: n.position.x + OFFSET_X,
            y: n.position.y + OFFSET_Y
          }
        };
      });

      finalEdges = importedEdges.map((e) => {
        return {
          ...e,
          id: `edge_${crypto.randomUUID()}`,
          source: idMap.get(e.source) || e.source,
          target: idMap.get(e.target) || e.target,
        };
      });

      setNodes((prev) => [...prev, ...finalNodes]);
      setEdges((prev) => [...prev, ...finalEdges]);
      toast.success("Workflow merged successfully! Auto-saving draft...");
    } else {
      if (importedTitle) {
        setTitle(importedTitle);
      }
      setNodes(finalNodes);
      setEdges(finalEdges);
      toast.success("Workflow replaced successfully! Auto-saving draft...");
    }

    setImportPreview(null);

    // Sync to other clients via realtime
    channelRef.current?.send({
      type: "broadcast",
      event: "sync-all",
      payload: mode === "merge" ? {
        nodes: [...nodes, ...finalNodes],
        edges: [...edges, ...finalEdges],
      } : {
        nodes: finalNodes,
        edges: finalEdges,
      },
    });
  }, [takeSnapshot, nodes, edges, toast]);

  // Sync refs to avoid re-binding keydown event listener
  const handleInstantSaveRef = useRef(handleInstantSave);
  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  const handleCopyRef = useRef(handleCopy);
  const handlePasteRef = useRef(handlePaste);
  const setShowShortcutHelpRef = useRef(setShowShortcutHelp);
  const setShowPublishConfirmRef = useRef(setShowPublishConfirm);
  const setInspectorOpenRef = useRef(setInspectorOpen);
  const setSelectedNodeIdRef = useRef(setSelectedNodeId);
  const setSelectedEdgeIdRef = useRef(setSelectedEdgeId);
  const setElementsToDeleteRef = useRef(setElementsToDelete);

  useEffect(() => {
    handleInstantSaveRef.current = handleInstantSave;
    handleUndoRef.current = handleUndo;
    handleRedoRef.current = handleRedo;
    handleCopyRef.current = handleCopy;
    handlePasteRef.current = handlePaste;
    setShowShortcutHelpRef.current = setShowShortcutHelp;
    setShowPublishConfirmRef.current = setShowPublishConfirm;
    setInspectorOpenRef.current = setInspectorOpen;
    setSelectedNodeIdRef.current = setSelectedNodeId;
    setSelectedEdgeIdRef.current = setSelectedEdgeId;
    setElementsToDeleteRef.current = setElementsToDelete;
  }, [
    handleInstantSave,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    setShowShortcutHelp,
    setShowPublishConfirm,
    setInspectorOpen,
    setSelectedNodeId,
    setSelectedEdgeId,
    setElementsToDelete,
  ]);


  // Window keydown listener for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if shortcuts are enabled (Esc should always work)
      if (!canvasPrefs.enableKeyboardShortcuts && e.key !== "Escape") {
        return;
      }

      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isMetaOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isMetaOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleInstantSaveRef.current();
      } else if (isMetaOrCtrl && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowPublishConfirmRef.current(true);
      } else if (isMetaOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndoRef.current();
      } else if (isMetaOrCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedoRef.current();
      } else if (isMetaOrCtrl && e.key.toLowerCase() === "c") {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
           return;
        }
        e.preventDefault();
        handleCopyRef.current();
      } else if (isMetaOrCtrl && e.key.toLowerCase() === "v") {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
           return;
        }
        e.preventDefault();
        handlePasteRef.current();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setInspectorOpenRef.current(false);
        setSelectedNodeIdRef.current(null);
        setSelectedEdgeIdRef.current(null);
        setShowPublishConfirmRef.current(false);
        setElementsToDeleteRef.current(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
           return;
        }
        
        const selectedNodes = nodesRef.current.filter(n => n.selected);
        const selectedEdges = edgesRef.current.filter(e => e.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          e.preventDefault();
          setElementsToDeleteRef.current({ nodes: selectedNodes, edges: selectedEdges });
        }
      } else if (e.key === "?" || e.key === "F1") {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
           return;
        }
        e.preventDefault();
        setShowShortcutHelpRef.current((prev) => !prev);
      } else if (!isMetaOrCtrl) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
           return;
        }
        if (e.key.toLowerCase() === "m") {
          setInteractionMode("marquee");
        } else if (e.key.toLowerCase() === "h") {
          setInteractionMode("pan");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Supabase Realtime Broadcast synchronization
  useEffect(() => {
    const channel = supabase.channel(`workflow-broadcast-${versionId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on("broadcast", { event: "node-change" }, (payload) => {
        const { changeType, data } = payload.payload;
        if (changeType === "drag") {
          const { id, position } = data;
          if (id === selectedNodeIdRef.current) return;
          setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, position } : n))
          );
        } else if (changeType === "add") {
          const { node } = data;
          setNodes((nds) => {
            if (nds.some((n) => n.id === node.id)) return nds;
            return nds.concat(node);
          });
        } else if (changeType === "update") {
          const { id, updates } = data;
          if (id === selectedNodeIdRef.current) return;
          setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      name: updates.name,
                      configuration: updates.configuration || {},
                    },
                  }
                : n
            )
          );
        } else if (changeType === "delete") {
          const { id } = data;
          setNodes((nds) => nds.filter((n) => n.id !== id));
          if (selectedNodeIdRef.current === id) {
            setSelectedNodeId(null);
            setInspectorOpen(false);
          }
        }
      })
      .on("broadcast", { event: "edge-change" }, (payload) => {
        const { changeType, data } = payload.payload;
        if (changeType === "add") {
          const { edge } = data;
          setEdges((eds) => {
            if (eds.some((e) => e.id === edge.id)) return eds;
            return eds.concat(edge);
          });
        } else if (changeType === "delete") {
          const { id } = data;
          setEdges((eds) => eds.filter((e) => e.id !== id));
        }
      })
      .on("broadcast", { event: "sync-all" }, (payload) => {
        const { nodes: newNodes, edges: newEdges } = payload.payload;
        setNodes(newNodes);
        setEdges(newEdges);
      })
      .subscribe((status) => {
        console.log(`Supabase Realtime Broadcast Status for version ${versionId}:`, status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [versionId, setNodes, setEdges]);

  // Handle updates from Properties Inspector sidebar panel
  const handleUpdateNode = useCallback(
    (nodeId: string, updates: { name: string; configuration: any }) => {
      takeEditSnapshot();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                name: updates.name,
                configuration: updates.configuration,
              },
            };
          }
          return node;
        })
      );

      channelRef.current?.send({
        type: "broadcast",
        event: "node-change",
        payload: {
          changeType: "update",
          data: {
            id: nodeId,
            updates,
          },
        },
      });
    },
    [setNodes, takeEditSnapshot]
  );

  const onCustomNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          channelRef.current?.send({
            type: "broadcast",
            event: "node-change",
            payload: {
              changeType: "drag",
              data: {
                id: change.id,
                position: change.position,
              },
            },
          });
        } else if (change.type === "remove") {
          channelRef.current?.send({
            type: "broadcast",
            event: "node-change",
            payload: {
              changeType: "delete",
              data: { id: change.id },
            },
          });
        }
      });
    },
    [onNodesChange]
  );

  const onCustomEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      changes.forEach((change) => {
        if (change.type === "remove") {
          channelRef.current?.send({
            type: "broadcast",
            event: "edge-change",
            payload: {
              changeType: "delete",
              data: { id: change.id },
            },
          });
        }
      });
    },
    [onEdgesChange]
  );

  // Open inspector when a node or edge is selected, close when selection is cleared
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedEdgeId(null);
    setSelectedNodeId(node.id);
    setInspectorOpen(true);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedNodeId(null);
    setSelectedEdgeId(edge.id);
    setInspectorOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drag drop to create new node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as any;
      const name = event.dataTransfer.getData("application/reactflow-name");

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Default configurations
      let configuration = {};
      if (type === "action") {
        configuration = { method: "GET", url: "https://api.example.com" };
      } else if (type === "logic") {
        configuration = { field: "status", operator: "==", value: "completed" };
      } else if (type === "ai") {
        configuration = { prompt: "Analyze inputs and summarize key details." };
      } else if (type === "trigger") {
        configuration = { description: "Start the workflow execution manually." };
      }

      const newNode: Node = {
        id: `node_${crypto.randomUUID()}`,
        type,
        position,
        data: {
          name,
          configuration,
        },
      };

      takeSnapshot();
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
      setInspectorOpen(true);

      channelRef.current?.send({
        type: "broadcast",
        event: "node-change",
        payload: {
          changeType: "add",
          data: { node: newNode },
        },
      });
    },
    [screenToFlowPosition, setNodes, takeSnapshot]
  );

  // Handle click to add from Node Library
  const handleAddNode = useCallback(
    (type: "trigger" | "action" | "logic" | "ai", name: string) => {
      // Position new node slightly offset from center
      const position = {
        x: 200 + Math.random() * 100,
        y: 150 + Math.random() * 100,
      };

      let configuration = {};
      if (type === "action") {
        configuration = { method: "GET", url: "https://api.example.com" };
      } else if (type === "logic") {
        configuration = { field: "status", operator: "==", value: "completed" };
      } else if (type === "ai") {
        configuration = { prompt: "Analyze inputs and summarize key details." };
      } else if (type === "trigger") {
        configuration = { description: "Start the workflow execution manually." };
      }

      const newNode: Node = {
        id: `node_${crypto.randomUUID()}`,
        type,
        position,
        data: {
          name,
          configuration,
        },
      };

      takeSnapshot();
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
      setInspectorOpen(true);

      channelRef.current?.send({
        type: "broadcast",
        event: "node-change",
        payload: {
          changeType: "add",
          data: { node: newNode },
        },
      });
    },
    [setNodes, takeSnapshot]
  );

  // Handle linking node connections
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      let label = undefined;
      let branch = undefined;

      // Logic branch mapping (True / False output ports)
      if (sourceNode && sourceNode.type === "logic") {
        branch = params.sourceHandle;
        label = params.sourceHandle === "true" ? "True" : "False";
      }

      const newEdge: Edge = {
        ...params,
        id: `edge_${crypto.randomUUID()}`,
        label,
        data: {
          branch,
        },
      };

      takeSnapshot();
      setEdges((eds) => addEdge(newEdge, eds));

      channelRef.current?.send({
        type: "broadcast",
        event: "edge-change",
        payload: {
          changeType: "add",
          data: { edge: newEdge },
        },
      });
    },
    [nodes, setEdges, takeSnapshot]
  );

  // Handle Execution Run
  const handleRun = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    try {
      const res = await executeWorkflowAction(workflowId);
      if (res.success && res.data) {
        toast.success("Execution triggered successfully!");
        router.push(`/executions/${res.data.id}`);
      } else {
        setErrorMessage(res.error || "Execution failed");
        toast.error(res.error || "Failed to execute workflow. Make sure it is published first.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to run execution");
      toast.error(err.message || "An unexpected error occurred during execution.");
    } finally {
      setIsRunning(false);
    }
  };

  // Handle Publish / Deployment
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await publishDraftAction(workflowId);
      if (res.success) {
        setErrorMessage(null);
        toast.success("Workflow version successfully published! A new active Draft has been created.");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to publish workflow");
        toast.error(res.error || "Failed to publish workflow");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to publish workflow");
      toast.error(err.message || "Failed to publish workflow due to connection error");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen relative w-full overflow-hidden">
      {/* Editor Header Toolbar */}
      <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-lg shrink-0 z-10">
        <div className="flex items-center gap-md">
          <Link
            href="/dashboard"
            className="p-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-outline-variant mx-1"></div>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTitleSave();
                } else if (e.key === "Escape") {
                  setTitle(workflowTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-surface-container border border-primary px-2 py-0.5 rounded text-headline-sm font-semibold text-on-surface focus:outline-none"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-sm cursor-pointer group hover:bg-surface-container/50 px-2 py-0.5 rounded transition-all"
              title="Click to edit workflow title"
            >
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {title}
              </h2>
              <Pencil className="w-3.5 h-3.5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <div className="h-4 w-px bg-outline-variant mx-1"></div>
          <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-2 py-1 rounded">
            Draft
          </span>
        </div>
        {/* Toolbar actions */}
        <div className="flex items-center gap-md">
          {/* Debounced Save Status */}
          <div className="flex items-center gap-sm font-label-sm text-[11px] text-on-surface-variant">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Auto-saving...</span>
              </>
            )}
            {saveStatus === "saved" && !errorMessage && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>Saved to cloud</span>
              </>
            )}
            {errorMessage && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-error" />
                <span className="text-error truncate max-w-[150px]">{errorMessage}</span>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className={`flex items-center gap-xs px-2.5 py-1.5 rounded transition-colors font-label-md text-[12px] ${showSettingsDropdown ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'}`}
              title="Editor Settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Settings
            </button>
            
            {showSettingsDropdown && (
              <div className="absolute top-10 right-0 w-72 bg-surface border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                  <h3 className="font-headline-sm text-sm font-semibold text-on-surface flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    Editor Settings
                  </h3>
                  <button onClick={() => setShowSettingsDropdown(false)} className="text-on-surface-variant hover:text-on-surface">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                  {/* Canvas Preferences */}
                  <div className="flex flex-col gap-3">
                    <h4 className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Canvas</h4>
                    
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={preferences?.canvas?.showGrid !== false}
                        onChange={(e) => handleUpdatePreference("canvas", "showGrid", e.target.checked)}
                        className="mt-0.5 rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                      />
                      <div className="flex flex-col">
                        <span className="font-body-md text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Show Dot Grid</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">Display grid points on the canvas.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!preferences?.canvas?.snapToGrid}
                        onChange={(e) => handleUpdatePreference("canvas", "snapToGrid", e.target.checked)}
                        className="mt-0.5 rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                      />
                      <div className="flex flex-col">
                        <span className="font-body-md text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Snap to Grid</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">Snap nodes to 20px grid points.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={preferences?.canvas?.showMinimap !== false}
                        onChange={(e) => handleUpdatePreference("canvas", "showMinimap", e.target.checked)}
                        className="mt-0.5 rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                      />
                      <div className="flex flex-col">
                        <span className="font-body-md text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Show Minimap</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">Show navigator in bottom right.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={preferences?.canvas?.enableAnimations !== false}
                        onChange={(e) => handleUpdatePreference("canvas", "enableAnimations", e.target.checked)}
                        className="mt-0.5 rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                      />
                      <div className="flex flex-col">
                        <span className="font-body-md text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Edge Animations</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">Animate lines to show flow direction.</span>
                      </div>
                    </label>
                  </div>

                  <div className="h-px bg-outline-variant/50 w-full my-1"></div>

                  {/* Interface Preferences */}
                  <div className="flex flex-col gap-3">
                    <h4 className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Interface</h4>
                    
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!preferences?.compactMode}
                        onChange={(e) => handleUpdatePreference("compactMode", null, e.target.checked)}
                        className="mt-0.5 rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                      />
                      <div className="flex flex-col">
                        <span className="font-body-md text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Compact Layout</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">Reduce padding in lists and sidebars.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shortcuts button */}
          <button
            onClick={() => setShowShortcutHelp(true)}
            className="flex items-center gap-xs px-2.5 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-[12px]"
            title="Keyboard Shortcuts Guide (?, F1)"
          >
            <Keyboard className="w-3.5 h-3.5 text-primary" />
            Shortcuts
          </button>

          {/* Export JSON button */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-xs px-2.5 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-[12px]"
            title="Export workflow to JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          {/* Import JSON button */}
          <label
            className="flex items-center gap-xs px-2.5 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant cursor-pointer transition-colors font-label-md text-[12px]"
            title="Import workflow from JSON file"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-xs px-3 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-[12px] disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 text-primary fill-primary" />
            )}
            Run
          </button>

          <button
            onClick={() => setShowPublishConfirm(true)}
            disabled={isPublishing}
            className="flex items-center gap-xs px-4 py-1.5 rounded bg-primary-container text-on-primary-container hover:opacity-90 transition-opacity font-label-md text-[12px] shadow-sm disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            Publish
          </button>
        </div>
      </header>

      {/* Editor Canvas workspace */}
      <div className="flex-1 flex relative w-full overflow-hidden">
        {/* Left sidebar: Library */}
        <NodeLibrary onAddNode={handleAddNode} />

        {/* Canvas Area */}
        <div
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex-1 h-full canvas-bg relative overflow-hidden"
        >
          {/* Interaction Toolbar */}
          <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-surface border border-outline-variant rounded-full shadow-lg p-2 flex flex-col gap-2 z-50">
            <button
              onClick={() => setInteractionMode("marquee")}
              title="Marquee Selection (M)"
              className={`p-2.5 rounded-full transition-colors ${
                interactionMode === "marquee"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              }`}
            >
              <BoxSelect className="w-5 h-5" />
            </button>
            <button
              onClick={() => setInteractionMode("pan")}
              title="Pan (H)"
              className={`p-2.5 rounded-full transition-colors ${
                interactionMode === "pan"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              }`}
            >
              <Hand className="w-5 h-5" />
            </button>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 800 })}
              title="Fit to Screen (Zoom Fit)"
              className="p-2.5 rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>

          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onCustomNodesChange}
            onEdgesChange={onCustomEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeDragStart={() => takeSnapshot()}
            onSelectionDragStart={() => takeSnapshot()}
            onSelectionChange={({ nodes: selNodes, edges: selEdges }) => {
              if (selNodes.length + selEdges.length > 1) {
                setInspectorOpen(true);
              }
            }}
            nodeTypes={nodeTypes}
            deleteKeyCode={null}
            panOnDrag={interactionMode === "pan"}
            selectionOnDrag={interactionMode === "marquee"}
            selectionMode={SelectionMode.Partial}
            nodesDraggable={interactionMode !== "pan"}
            elementsSelectable={true}
            panOnScroll={interactionMode === "marquee"}
            zoomOnScroll={interactionMode !== "marquee"}
            snapToGrid={canvasPrefs.snapToGrid}
            snapGrid={[20, 20]}
            defaultViewport={{ x: 0, y: 0, zoom: canvasPrefs.defaultZoom || 1 }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            colorMode={isDark ? "dark" : "light"}
          >
            {canvasPrefs.showGrid && (
              <Background
                color={isDark ? "var(--outline-variant)" : "#e2e8f0"}
                gap={20}
                size={1}
                variant={BackgroundVariant.Dots}
              />
            )}
            
            <Controls
              showInteractive={false}
              position="bottom-left"
              className={isDark ? "!bg-surface-container-lowest !border-outline-variant !fill-on-surface" : ""}
            />
            
            {canvasPrefs.showMinimap && (
              <MiniMap
                style={{
                  background: "var(--surface-container-lowest)",
                  borderRadius: "8px",
                  border: "1px solid var(--outline-variant)",
                }}
                nodeColor={(node) => {
                  switch (node.type) {
                    case "trigger": return isDark ? "#4f46e5" : "#6366f1";
                    case "action": return isDark ? "#0ea5e9" : "#38bdf8";
                    case "condition": return isDark ? "#d97706" : "#fbbf24";
                    default: return isDark ? "#3f3f46" : "#cbd5e1";
                  }
                }}
                maskColor={isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.15)"}
                zoomable
                pannable
                className={isDark ? "!bg-surface-container-lowest" : ""}
              />
            )}
          </ReactFlow>
        </div>

        {/* Right sidebar: Inspector */}
        {inspectorOpen && (
          <EditorInspector
            selectedNodes={nodes.filter(n => n.selected)}
            selectedEdges={edges.filter(e => e.selected)}
            onHoverItem={setHoveredItemId}
            node={
              selectedNode
                ? {
                    id: selectedNode.id,
                    type: selectedNode.type || "action",
                    data: {
                      name: selectedNode.data?.name as string || "Node",
                      configuration: selectedNode.data?.configuration || {},
                    },
                  }
                : undefined
            }
            edge={selectedEdge}
            onUpdateNode={handleUpdateNode}
            onClose={() => setInspectorOpen(false)}
            onDelete={() => {
              const selectedNds = nodes.filter(n => n.selected);
              const selectedEds = edges.filter(e => e.selected);
              
              if (selectedNds.length > 1 || selectedEds.length > 1 || (selectedNds.length === 1 && selectedEds.length === 1)) {
                setElementsToDelete({ nodes: selectedNds, edges: selectedEds });
              } else if (selectedNodeId) {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (node) setElementsToDelete({ nodes: [node], edges: [] });
              } else if (selectedEdgeId) {
                const edge = edges.find(e => e.id === selectedEdgeId);
                if (edge) setElementsToDelete({ nodes: [], edges: [edge] });
              }
            }}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {elementsToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
          <div className="bg-surface border border-outline-variant rounded-xl shadow-xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            <div className="p-lg flex flex-col gap-md">
              <div className="flex items-center gap-sm text-error">
                <Trash2 className="w-6 h-6" />
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Delete Selected Items
                </h3>
              </div>
              <div className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                <p className="mb-2">Are you sure you want to delete the following items? This action cannot be undone.</p>
                <div className="max-h-48 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded p-3 text-xs">
                  {elementsToDelete.nodes.length > 0 && (
                    <div className="mb-3">
                      <strong className="text-on-surface block mb-1">Nodes:</strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-on-surface-variant">
                        {elementsToDelete.nodes.map(n => (
                          <li key={n.id}>{n.data?.name as string || "Unnamed Node"}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(() => {
                    const implicitEdges = edges.filter(e => elementsToDelete.nodes.some(n => n.id === e.source || n.id === e.target));
                    const allEdges = Array.from(new Set([...elementsToDelete.edges, ...implicitEdges]));
                    if (allEdges.length === 0) return null;
                    return (
                      <div>
                        <strong className="text-on-surface block mb-1">Connections:</strong>
                        <ul className="list-disc pl-4 space-y-0.5 text-on-surface-variant">
                          {allEdges.map(e => {
                            const sourceName = nodes.find(n => n.id === e.source)?.data?.name || e.source;
                            const targetName = nodes.find(n => n.id === e.target)?.data?.name || e.target;
                            return (
                              <li key={e.id}>{sourceName as string} ➔ {targetName as string}</li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center justify-end gap-md mt-sm">
                <button
                  onClick={() => setElementsToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteElements({ nodes: elementsToDelete.nodes, edges: elementsToDelete.edges });
                    if (elementsToDelete.nodes.some(n => n.id === selectedNodeId)) setSelectedNodeId(null);
                    if (elementsToDelete.edges.some(e => e.id === selectedEdgeId)) setSelectedEdgeId(null);
                    setInspectorOpen(false);
                    setElementsToDelete(null);
                  }}
                  className="flex items-center gap-xs px-5 py-2 text-sm font-medium rounded-lg bg-error text-on-error hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
          <div className="bg-surface border border-outline-variant rounded-xl shadow-xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            <div className="p-lg flex flex-col gap-md">
              <div className="flex items-center gap-sm text-primary">
                <Rocket className="w-6 h-6" />
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Publish Workflow
                </h3>
              </div>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                Are you sure you want to publish this workflow version? This will compile your draft nodes and edges into an active deployment. Once published, your execution engine will run this version. A new editable Draft version will be created for you.
              </p>
              <div className="flex items-center justify-end gap-md mt-sm">
                <button
                  onClick={() => setShowPublishConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowPublishConfirm(false);
                    await handlePublish();
                  }}
                  disabled={isPublishing}
                  className="flex items-center gap-xs px-5 py-2 text-sm font-medium rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Publish Version
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Help Modal */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
          <div className="bg-surface border border-outline-variant rounded-xl shadow-xl max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            <div className="p-lg flex flex-col gap-md">
              <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
                <div className="flex items-center gap-sm text-primary">
                  <Keyboard className="w-6 h-6" />
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setShowShortcutHelp(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-x-lg gap-y-sm mt-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Save Draft</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Ctrl+S</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Publish</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Ctrl+Shift+P</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Undo</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Ctrl+Z</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Redo</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Ctrl+Y</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Copy selected</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Ctrl+C</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Paste</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Ctrl+V</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Delete selected items</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Del/Backsp</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Marquee selection</span>
                  <kbd className="px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">M</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Pan mode</span>
                  <kbd className="px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">H</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5">
                  <span className="text-on-surface-variant text-[13px]">Close panel / modal</span>
                  <kbd className="px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">Esc</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/30 py-1.5 col-span-2">
                  <span className="text-on-surface-variant text-[13px]">Toggle Shortcut Guide</span>
                  <kbd className="px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-[11px] font-mono font-bold shadow-sm">? / F1</kbd>
                </div>
              </div>

              <div className="flex justify-end mt-sm">
                <button
                  onClick={() => setShowShortcutHelp(false)}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-sm"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Dialog */}
      <ImportDialog
        preview={importPreview}
        onCancel={() => setImportPreview(null)}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}

export default function EditorCanvas(props: EditorCanvasProps) {
  return (
    <div className="w-screen h-screen overflow-hidden flex bg-background">
      <ReactFlowProviderWrapper props={props} />
    </div>
  );
}

function ReactFlowProviderWrapper({ props }: { props: EditorCanvasProps }) {
  return (
    <ReactFlowProvider>
      <EditorCanvasContent {...props} />
    </ReactFlowProvider>
  );
}
