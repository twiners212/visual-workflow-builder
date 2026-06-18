import React, { useState } from "react";
import { Play, Globe, GitBranch, Sparkles, Search, X } from "lucide-react";

interface NodeLibraryProps {
  onAddNode?: (type: "trigger" | "action" | "logic" | "ai", name: string) => void;
}

export default function NodeLibrary({ onAddNode }: NodeLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const onDragStart = (
    event: React.DragEvent,
    nodeType: "trigger" | "action" | "logic" | "ai",
    name: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/reactflow-name", name);
    event.dataTransfer.effectAllowed = "move";
  };

  const categories = [
    {
      title: "TRIGGERS",
      items: [
        {
          type: "trigger" as const,
          name: "Manual Trigger",
          description: "Start workflow manually",
          icon: Play,
          colorClass: "bg-primary/10 text-primary hover:border-primary",
        },
      ],
    },
    {
      title: "ACTIONS",
      items: [
        {
          type: "action" as const,
          name: "HTTP Request",
          description: "Call an external API",
          icon: Globe,
          colorClass: "bg-tertiary/10 text-tertiary hover:border-tertiary",
        },
      ],
    },
    {
      title: "LOGIC",
      items: [
        {
          type: "logic" as const,
          name: "IF Condition",
          description: "Split flow by conditions",
          icon: GitBranch,
          colorClass: "bg-secondary/10 text-secondary hover:border-secondary",
        },
      ],
    },
    {
      title: "AI",
      items: [
        {
          type: "ai" as const,
          name: "AI Prompt Node",
          description: "Generate responses with AI",
          icon: Sparkles,
          colorClass: "bg-purple-100 text-purple-700 hover:border-purple-500",
        },
      ],
    },
  ];

  // Filter categories and their items based on search query
  const filteredCategories = categories
    .map((category) => {
      const matchedItems = category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...category,
        items: matchedItems,
      };
    })
    .filter((category) => category.items.length > 0);

  return (
    <div className="w-64 h-full bg-surface border-r border-outline-variant flex flex-col z-10 shrink-0">
      <div className="p-md border-b border-outline-variant/50 bg-surface-container-lowest flex flex-col gap-2">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
          Node Library
        </h3>
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded px-lg py-1.5 pl-8 pr-7 font-body-md text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-2.5 top-1/2 transform -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-on-surface-variant hover:text-on-surface absolute right-2.5 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-lg select-none">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.title}>
              <h4 className="font-label-sm text-label-sm text-on-surface-variant mb-sm tracking-wider font-bold">
                {category.title}
              </h4>
              <div className="flex flex-col gap-sm">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type, item.name)}
                      onClick={() => onAddNode?.(item.type, item.name)}
                      className="p-sm border border-outline-variant bg-surface-container-lowest rounded-lg cursor-grab hover:shadow-sm transition-all flex items-start gap-sm active:cursor-grabbing hover:border-primary group"
                      title="Drag onto canvas or click to add"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-body-md text-[13px] font-semibold text-on-surface group-hover:text-primary transition-colors block">
                          {item.name}
                        </span>
                        <span className="font-body-md text-[11px] text-on-surface-variant block truncate">
                          {item.description}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
            <span className="text-xs">No nodes match search</span>
          </div>
        )}
      </div>
    </div>
  );
}
