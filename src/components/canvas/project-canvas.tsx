"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  StickyNote, FileText, Lightbulb, Type, Image as ImageIcon,
  Save, Loader2, Plus, Trash2, Copy, Check, X, Search,
  ArrowRight, ExternalLink, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// RICH NODE COMPONENTS
// ============================================

function ResearchNode({ data }: { data: any }) {
  return (
    <div
      className="relative group"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); data.onContext?.(e.clientX, e.clientY); }}
      onDoubleClick={() => data.onOpen?.()}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#F72585]/50 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#F72585]/50 !border-0" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#F72585]/50 !border-0" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#F72585]/50 !border-0" />
      <div className="w-[280px] rounded-xl border border-[#F72585]/20 bg-[#111b2e]/95 backdrop-blur-sm shadow-lg shadow-[#F72585]/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F72585]/10 bg-[#F72585]/5">
          <Search className="h-3 w-3 text-[#F72585]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F72585]">Research</span>
          {/* Approve/Discard */}
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); data.onApprove?.(); }}
              className="flex h-5 w-5 items-center justify-center rounded bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20" title="Approve to Board">
              <Check className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); data.onDiscard?.(); }}
              className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Discard">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="px-3 py-2 max-h-[200px] overflow-y-auto">
          <p className="text-[12px] font-semibold leading-tight mb-1">{data.title}</p>
          {data.description && (
            <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{data.description}</p>
          )}
        </div>
        {data.image && (
          <div className="px-3 pb-2">
            <img src={data.image} alt="" className="w-full rounded-lg max-h-32 object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaNode({ data }: { data: any }) {
  return (
    <div
      className="relative group"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); data.onContext?.(e.clientX, e.clientY); }}
      onDoubleClick={() => data.onOpen?.()}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#FFD60A]/50 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#FFD60A]/50 !border-0" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#FFD60A]/50 !border-0" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#FFD60A]/50 !border-0" />
      <div className="w-[240px] rounded-xl border border-[#FFD60A]/20 bg-[#111b2e]/95 backdrop-blur-sm shadow-lg shadow-[#FFD60A]/5 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#FFD60A]/10 bg-[#FFD60A]/5">
          <Lightbulb className="h-3 w-3 text-[#FFD60A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD60A]">Idea</span>
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); data.onApprove?.(); }}
              className="flex h-5 w-5 items-center justify-center rounded bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20" title="Approve to Board">
              <Check className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); data.onDiscard?.(); }}
              className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Discard">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="text-[12px] font-semibold leading-tight">{data.title}</p>
          {data.description && (
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-4">{data.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskNode({ data }: { data: any }) {
  return (
    <div
      className="relative group"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); data.onContext?.(e.clientX, e.clientY); }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#a855f7]/50 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#a855f7]/50 !border-0" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#a855f7]/50 !border-0" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#a855f7]/50 !border-0" />
      <div className="w-[220px] rounded-xl border border-[#a855f7]/20 bg-[#111b2e]/95 backdrop-blur-sm shadow-lg shadow-[#a855f7]/5 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#a855f7]/10 bg-[#a855f7]/5">
          <FileText className="h-3 w-3 text-[#a855f7]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a855f7]">Task</span>
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); data.onDiscard?.(); }}
              className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Remove">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="text-[12px] font-semibold leading-tight">{data.title}</p>
          {data.description && (
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">{data.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextNode({ data }: { data: any }) {
  return (
    <div
      className="relative group"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); data.onContext?.(e.clientX, e.clientY); }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-white/20 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-white/20 !border-0" />
      <div className="w-[200px] rounded-xl border border-border/30 bg-[#111b2e]/80 backdrop-blur-sm p-3">
        <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{data.text || "Text block"}</p>
      </div>
    </div>
  );
}

function ImageNode({ data }: { data: any }) {
  return (
    <div
      className="relative group"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); data.onContext?.(e.clientX, e.clientY); }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-white/20 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-white/20 !border-0" />
      <div className="rounded-xl border border-border/30 bg-[#111b2e]/80 backdrop-blur-sm overflow-hidden shadow-lg">
        <img src={data.url} alt={data.title || ""} className="w-[280px] max-h-[200px] object-cover" />
        {data.title && (
          <div className="px-3 py-2">
            <p className="text-[11px] font-medium">{data.title}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  research: ResearchNode,
  idea: IdeaNode,
  task: TaskNode,
  note: ResearchNode, // reuse research style for notes
  textBlock: TextNode,
  image: ImageNode,
  textCard: TaskNode, // fallback
  script: TaskNode, // fallback
};

const nodeColors: Record<string, string> = {
  research: "#F72585",
  idea: "#FFD60A",
  task: "#a855f7",
  note: "#30BCED",
  textBlock: "#64748b",
  image: "#06b6d4",
  textCard: "#a855f7",
  script: "#2EC4B6",
};

// ============================================
// MAIN CANVAS COMPONENT
// ============================================

interface ProjectCanvasProps {
  projectId: string;
  projectNotes?: any[];
  projectIdeas?: any[];
  projectScripts?: any[];
}

export function ProjectCanvas({ projectId }: ProjectCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  // All content for the add panel
  const [allIdeas, setAllIdeas] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ideas").then((r) => r.json()),
      fetch("/api/notes").then((r) => r.json()),
    ]).then(([ideas, notes]) => {
      setAllIdeas(ideas || []);
      setAllNotes(notes || []);
    }).catch(() => {});
  }, []);

  const typeHrefs: Record<string, (id: string) => string> = {
    idea: (id) => `/ideas/${id}`,
    note: (id) => `/notes/${id}`,
    script: (id) => `/scripts/${id}`,
  };

  // Enrich data with handlers
  const enrichData = useCallback((nodeId: string, type: string, data: any) => ({
    ...data,
    onOpen: data.contentId && typeHrefs[type]
      ? () => router.push(typeHrefs[type](data.contentId))
      : undefined,
    onContext: (x: number, y: number) => setContextMenu({ x, y, nodeId }),
    onApprove: () => approveToBoard(nodeId, data),
    onDiscard: () => discardNode(nodeId),
  }), [router]);

  // Load canvas
  useEffect(() => {
    fetch(`/api/canvas/${projectId}`)
      .then((r) => r.json())
      .then((canvasData) => {
        if (canvasData?.nodes?.length) {
          setNodes(canvasData.nodes.map((n: any) => ({
            ...n,
            data: enrichData(n.id, n.type || "", n.data || {}),
          })));
        }
        if (canvasData?.edges?.length) setEdges(canvasData.edges);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [projectId]);

  // Auto-save
  const saveCanvas = useCallback(() => {
    if (!loaded) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/canvas/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({
            ...n,
            data: { ...n.data, onOpen: undefined, onContext: undefined, onApprove: undefined, onDiscard: undefined },
          })),
          edges,
        }),
      });
      setSaving(false);
    }, 1500);
  }, [nodes, edges, projectId, loaded]);

  useEffect(() => { saveCanvas(); }, [nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds: Edge[]) => addEdge({ ...connection, animated: true }, eds));
    },
    [setEdges]
  );

  const addNode = (type: string, data: any, position?: { x: number; y: number }) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: position || { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      data: enrichData(id, type, data),
    };
    setNodes((nds) => [...nds, newNode]);
    return id;
  };

  const approveToBoard = async (nodeId: string, data: any) => {
    // Create a task from this canvas node
    try {
      const boardRes = await fetch(`/api/boards/${projectId}`);
      const columns = await boardRes.json();
      const todoCol = columns.find((c: any) => c.title === "To Do") || columns[1] || columns[0];
      if (!todoCol) return;

      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          columnId: todoCol.id,
          title: data.title || "Untitled",
          description: data.description?.slice(0, 500),
          priority: data.priority || "medium",
        }),
      });

      toast.success(`"${data.title}" approved → To Do`);
    } catch {
      toast.error("Failed to approve");
    }
  };

  const discardNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    toast.success("Discarded");
  };

  const onPaneClick = useCallback(() => setContextMenu(null), []);

  return (
    <div className="h-[calc(100vh-14rem)] rounded-xl border border-border/30 overflow-hidden bg-[#080d1a]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "rgba(168, 85, 247, 0.3)", strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="!bg-[#080d1a] [&>pattern>circle]:!fill-[#1a1a3e]" />
        <Controls
          showInteractive={false}
          className="!bg-[#111b2e] !border-border/30 !rounded-lg !shadow-lg [&>button]:!bg-[#111b2e] [&>button]:!border-border/30 [&>button]:!text-foreground"
        />
        <MiniMap
          nodeColor={(node) => nodeColors[node.type || ""] || "#666"}
          className="!bg-[#111b2e]/80 !border-border/30 !rounded-lg"
          maskColor="rgba(0,0,0,0.7)"
        />

        {/* Add panel */}
        <Panel position="top-left">
          <div className="flex items-center gap-1 glass-card p-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px]"
              onClick={() => addNode("textBlock", { text: "New text" })}>
              <Type className="h-3 w-3" /> Text
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px]"
              onClick={() => addNode("idea", { title: "New Idea" })}>
              <Lightbulb className="h-3 w-3 text-[#FFD60A]" /> Idea
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px]"
              onClick={() => addNode("task", { title: "New Task" })}>
              <FileText className="h-3 w-3 text-[#a855f7]" /> Task
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px]"
              onClick={() => {
                const url = window.prompt("Image URL:");
                if (url) addNode("image", { url, title: "" });
              }}>
              <ImageIcon className="h-3 w-3 text-[#06b6d4]" /> Image
            </Button>
          </div>
        </Panel>

        {/* Content library */}
        <Panel position="top-right">
          <div className="glass-card p-1.5 w-48 max-h-64 overflow-y-auto">
            <p className="text-[9px] font-bold text-muted-foreground px-1 uppercase tracking-widest mb-1">Add Content</p>
            {allIdeas.map((idea: any) => (
              <button key={idea.id}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] hover:bg-white/5 text-left w-full"
                onClick={() => addNode("idea", { contentId: idea.id, title: idea.title, description: idea.body?.slice(0, 150) })}>
                <Lightbulb className="h-2.5 w-2.5 text-[#FFD60A] shrink-0" />
                <span className="truncate">{idea.title}</span>
              </button>
            ))}
            {allNotes.map((note: any) => (
              <button key={note.id}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] hover:bg-white/5 text-left w-full"
                onClick={() => addNode("research", { contentId: note.id, title: note.title, description: note.contentPlain?.slice(0, 200) })}>
                <StickyNote className="h-2.5 w-2.5 text-[#30BCED] shrink-0" />
                <span className="truncate">{note.title}</span>
              </button>
            ))}
          </div>
        </Panel>

        {/* Save indicator */}
        <Panel position="bottom-left">
          <div className="flex items-center gap-1.5 glass-card px-2 py-1 text-[10px] text-muted-foreground">
            {saving ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-3 w-3" /> Auto-saved</>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 glass-card p-1 shadow-xl min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => { approveToBoard(contextMenu.nodeId, nodes.find(n => n.id === contextMenu.nodeId)?.data || {}); setContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] hover:bg-white/5">
            <Check className="h-3 w-3 text-[#22c55e]" /> Approve to Board
          </button>
          <button onClick={() => {
            const orig = nodes.find(n => n.id === contextMenu.nodeId);
            if (orig) addNode(orig.type || "textBlock", { ...orig.data }, { x: orig.position.x + 20, y: orig.position.y + 20 });
            setContextMenu(null);
          }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] hover:bg-white/5">
            <Copy className="h-3 w-3" /> Duplicate
          </button>
          <button onClick={() => { discardNode(contextMenu.nodeId); setContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-3 w-3" /> Discard
          </button>
        </div>
      )}
    </div>
  );
}
