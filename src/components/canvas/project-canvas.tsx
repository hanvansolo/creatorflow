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
import {
  StickyNote, FileText, Lightbulb, Type, Image as ImageIcon,
  Save, Loader2, Plus, Trash2, Copy,
} from "lucide-react";
import { toast } from "sonner";

// Compact node with handles and color
function ContentNode({ data, color, icon: Icon, label }: { data: any; color: string; icon: any; label: string }) {
  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-muted-foreground/30 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-muted-foreground/30 !border-0" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground/30 !border-0" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground/30 !border-0" />
      <div
        className="rounded-md border bg-background px-2.5 py-1.5 shadow-sm max-w-[180px] text-left"
        style={{ borderColor: color, borderLeftWidth: 3 }}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <Icon className="h-2.5 w-2.5 shrink-0" style={{ color }} />
          <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
        </div>
        <p className="text-[11px] font-medium leading-tight truncate">{data.title || "Untitled"}</p>
        {data.description && (
          <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">{data.description}</p>
        )}
      </div>
    </div>
  );
}

function IdeaNode({ data }: { data: any }) {
  return <ContentNode data={data} color="#FFD60A" icon={Lightbulb} label="Idea" />;
}
function NoteNode({ data }: { data: any }) {
  return <ContentNode data={data} color="#30BCED" icon={StickyNote} label="Note" />;
}
function ScriptNode({ data }: { data: any }) {
  return <ContentNode data={data} color="#2EC4B6" icon={FileText} label="Script" />;
}
function TextCardNode({ data }: { data: any }) {
  return <ContentNode data={data} color="#9B5DE5" icon={Type} label="Card" />;
}
function TextBlockNode({ data }: { data: any }) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-muted-foreground/30 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-muted-foreground/30 !border-0" />
      <div className="rounded-md border border-border bg-muted/20 px-2.5 py-1.5 shadow-sm max-w-[180px]">
        <p className="text-[11px] whitespace-pre-wrap leading-tight">{data.text || "Text"}</p>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  textCard: TextCardNode,
  note: NoteNode,
  idea: IdeaNode,
  script: ScriptNode,
  textBlock: TextBlockNode,
};

const nodeColors: Record<string, string> = {
  idea: "#FFD60A",
  note: "#30BCED",
  script: "#2EC4B6",
  textCard: "#9B5DE5",
  textBlock: "#888",
};

interface ProjectCanvasProps {
  projectId: string;
  projectNotes?: any[];
  projectIdeas?: any[];
  projectScripts?: any[];
}

export function ProjectCanvas({ projectId, projectNotes = [], projectIdeas = [], projectScripts = [] }: ProjectCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch ALL user content for the add panel
  const [allIdeas, setAllIdeas] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [allScripts, setAllScripts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ideas").then((r) => r.json()),
      fetch("/api/notes").then((r) => r.json()),
      fetch("/api/scripts").then((r) => r.json()),
    ]).then(([ideas, notes, scripts]) => {
      setAllIdeas(ideas || []);
      setAllNotes(notes || []);
      setAllScripts(scripts || []);
    }).catch(() => {});
  }, []);

  // Load canvas
  useEffect(() => {
    fetch(`/api/canvas/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.nodes?.length) setNodes(data.nodes);
        if (data?.edges?.length) setEdges(data.edges);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [projectId]);

  // Auto-save on changes
  const saveCanvas = useCallback(() => {
    if (!loaded) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/canvas/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      setSaving(false);
    }, 1000);
  }, [nodes, edges, projectId, loaded]);

  useEffect(() => { saveCanvas(); }, [nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds: Edge[]) => addEdge({ ...connection, animated: true }, eds));
    },
    [setEdges]
  );

  const addNode = (type: string, data: any) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const deleteNode = () => {
    if (!contextMenu) return;
    setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
    setEdges((eds) => eds.filter((e) => {
      const src = typeof e.source === "string" ? e.source : e.source;
      const tgt = typeof e.target === "string" ? e.target : e.target;
      return src !== contextMenu.nodeId && tgt !== contextMenu.nodeId;
    }));
    setContextMenu(null);
  };

  const duplicateNode = () => {
    if (!contextMenu) return;
    const original = nodes.find((n) => n.id === contextMenu.nodeId);
    if (!original) return;
    const id = `${original.type}-${Date.now()}`;
    const newNode: Node = {
      ...original,
      id,
      position: { x: original.position.x + 20, y: original.position.y + 20 },
    };
    setNodes((nds) => [...nds, newNode]);
    setContextMenu(null);
  };

  const typeHrefs: Record<string, (id: string) => string> = {
    idea: (id) => `/ideas/${id}`,
    note: (id) => `/notes/${id}`,
    script: (id) => `/scripts/${id}`,
  };

  const openNode = (nodeId?: string) => {
    const nid = nodeId || contextMenu?.nodeId;
    if (!nid) return;
    const node = nodes.find((n) => n.id === nid);
    if (!node?.data?.contentId || !node.type) return;
    const href = typeHrefs[node.type]?.(node.data.contentId as string);
    if (href) router.push(href);
    setContextMenu(null);
  };

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.data?.contentId && node.type) {
      const href = typeHrefs[node.type]?.(node.data.contentId as string);
      if (href) router.push(href);
    }
  }, [router]);

  // Close context menu on click anywhere
  const onPaneClick = useCallback(() => setContextMenu(null), []);

  return (
    <div className="h-[calc(100vh-16rem)] rounded-xl border border-border/50 overflow-hidden bg-white dark:bg-[#0a0a0f]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        deleteKeyCode="Delete"
        defaultEdgeOptions={{ animated: true, style: { stroke: "#999", strokeWidth: 1 } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="!bg-white dark:!bg-[#0a0a0f] [&>pattern>circle]:!fill-gray-200 dark:[&>pattern>circle]:!fill-[#1a1a2e]" />
        <Controls
          showInteractive={false}
          className="!bg-background !border-border !rounded-lg !shadow-lg [&>button]:!bg-background [&>button]:!border-border [&>button]:!text-foreground"
        />
        <MiniMap
          nodeColor={(node) => nodeColors[node.type || ""] || "#888"}
          className="!bg-background/80 !border-border !rounded-lg"
          maskColor="rgba(0,0,0,0.1)"
        />

        {/* Toolbar */}
        <Panel position="top-left" className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-background/90 p-1 shadow-lg backdrop-blur-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => addNode("textBlock", { text: "New text block" })}
            >
              <Type className="h-3 w-3" /> Text
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => addNode("idea", { title: "New Idea", description: "" })}
            >
              <Lightbulb className="h-3 w-3 text-[#FFD60A]" /> Idea
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => addNode("note", { title: "New Note", description: "" })}
            >
              <StickyNote className="h-3 w-3 text-[#30BCED]" /> Note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => addNode("script", { title: "New Script", description: "" })}
            >
              <FileText className="h-3 w-3 text-[#2EC4B6]" /> Script
            </Button>
          </div>
        </Panel>

        {/* All content panel */}
        <Panel position="top-right" className="flex items-center gap-1.5">
          <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/90 p-1.5 shadow-lg backdrop-blur-sm max-h-72 w-52 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">Add to Canvas</p>

            {allIdeas.length > 0 && (
              <>
                <p className="text-[9px] font-medium text-[#FFD60A] px-1 mt-1">Ideas</p>
                {allIdeas.map((idea: any) => (
                  <button
                    key={idea.id}
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-accent text-left"
                    onClick={() => addNode("idea", { contentId: idea.id, title: idea.title, description: idea.body?.slice(0, 100) })}
                  >
                    <Lightbulb className="h-2.5 w-2.5 text-[#FFD60A] shrink-0" />
                    <span className="truncate">{idea.title}</span>
                  </button>
                ))}
              </>
            )}

            {allNotes.length > 0 && (
              <>
                <p className="text-[9px] font-medium text-[#30BCED] px-1 mt-1">Notes</p>
                {allNotes.map((note: any) => (
                  <button
                    key={note.id}
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-accent text-left"
                    onClick={() => addNode("note", { contentId: note.id, title: note.title, description: note.contentPlain?.slice(0, 100) })}
                  >
                    <StickyNote className="h-2.5 w-2.5 text-[#30BCED] shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </button>
                ))}
              </>
            )}

            {allScripts.length > 0 && (
              <>
                <p className="text-[9px] font-medium text-[#2EC4B6] px-1 mt-1">Scripts</p>
                {allScripts.map((script: any) => (
                  <button
                    key={script.id}
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-accent text-left"
                    onClick={() => addNode("script", { contentId: script.id, title: script.title, description: script.contentPlain?.slice(0, 100) })}
                  >
                    <FileText className="h-2.5 w-2.5 text-[#2EC4B6] shrink-0" />
                    <span className="truncate">{script.title}</span>
                  </button>
                ))}
              </>
            )}

            {allIdeas.length === 0 && allNotes.length === 0 && allScripts.length === 0 && (
              <p className="text-[10px] text-muted-foreground px-1 py-2">No content yet</p>
            )}
          </div>
        </Panel>

        {/* Save indicator */}
        <Panel position="bottom-left">
          <div className="flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
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
          className="fixed z-50 rounded-lg border bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {!!nodes.find((n) => n.id === contextMenu.nodeId)?.data?.contentId && (
            <button
              onClick={() => openNode()}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] hover:bg-accent transition-colors"
            >
              <FileText className="h-3 w-3" /> Open
            </button>
          )}
          <button
            onClick={duplicateNode}
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] hover:bg-accent transition-colors"
          >
            <Copy className="h-3 w-3" /> Duplicate
          </button>
          <button
            onClick={deleteNode}
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
