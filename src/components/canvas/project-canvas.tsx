"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
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
  Save, Loader2, Plus,
} from "lucide-react";
import { toast } from "sonner";

// Custom node components
function TextCardNode({ data }: { data: any }) {
  return (
    <div
      className="rounded-lg border-2 bg-background p-3 shadow-lg min-w-[160px] max-w-[300px]"
      style={{ borderColor: data.color || "#444" }}
    >
      {data.label && (
        <p className="text-xs font-semibold mb-1" style={{ color: data.color }}>
          {data.type?.toUpperCase()}
        </p>
      )}
      <p className="text-sm font-medium">{data.title || "Untitled"}</p>
      {data.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{data.description}</p>
      )}
    </div>
  );
}

function NoteNode({ data }: { data: any }) {
  return (
    <div className="rounded-lg border-2 border-[#30BCED] bg-[#30BCED]/5 p-3 shadow-lg min-w-[160px] max-w-[280px]">
      <div className="flex items-center gap-1.5 mb-1">
        <StickyNote className="h-3 w-3 text-[#30BCED]" />
        <span className="text-[10px] font-semibold text-[#30BCED]">NOTE</span>
      </div>
      <p className="text-sm font-medium">{data.title || "Untitled"}</p>
      {data.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{data.description}</p>
      )}
    </div>
  );
}

function IdeaNode({ data }: { data: any }) {
  return (
    <div className="rounded-lg border-2 border-[#FFD60A] bg-[#FFD60A]/5 p-3 shadow-lg min-w-[160px] max-w-[280px]">
      <div className="flex items-center gap-1.5 mb-1">
        <Lightbulb className="h-3 w-3 text-[#FFD60A]" />
        <span className="text-[10px] font-semibold text-[#FFD60A]">IDEA</span>
      </div>
      <p className="text-sm font-medium">{data.title || "Untitled"}</p>
      {data.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{data.description}</p>
      )}
    </div>
  );
}

function ScriptNode({ data }: { data: any }) {
  return (
    <div className="rounded-lg border-2 border-[#2EC4B6] bg-[#2EC4B6]/5 p-3 shadow-lg min-w-[160px] max-w-[280px]">
      <div className="flex items-center gap-1.5 mb-1">
        <FileText className="h-3 w-3 text-[#2EC4B6]" />
        <span className="text-[10px] font-semibold text-[#2EC4B6]">SCRIPT</span>
      </div>
      <p className="text-sm font-medium">{data.title || "Untitled"}</p>
      {data.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{data.description}</p>
      )}
    </div>
  );
}

function TextBlockNode({ data }: { data: any }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 shadow-sm min-w-[120px] max-w-[300px]">
      <p className="text-sm whitespace-pre-wrap">{data.text || "Double-click to edit"}</p>
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
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div className="h-[calc(100vh-16rem)] rounded-xl border border-border/50 overflow-hidden bg-[#0a0a0f]">
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
        defaultEdgeOptions={{ animated: true, style: { stroke: "#444", strokeWidth: 1.5 } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#1a1a2e" />
        <Controls
          showInteractive={false}
          className="!bg-background !border-border !rounded-lg !shadow-lg [&>button]:!bg-background [&>button]:!border-border [&>button]:!text-foreground"
        />
        <MiniMap
          nodeColor={(node) => nodeColors[node.type || ""] || "#888"}
          className="!bg-background/80 !border-border !rounded-lg"
          maskColor="rgba(0,0,0,0.7)"
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

        {/* Existing content */}
        <Panel position="top-right" className="flex items-center gap-1.5">
          <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/90 p-1.5 shadow-lg backdrop-blur-sm max-h-48 overflow-y-auto">
            <p className="text-[10px] font-medium text-muted-foreground px-1">Drag content onto canvas</p>
            {projectIdeas.map((idea: any) => (
              <button
                key={idea.id}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-accent text-left"
                onClick={() => addNode("idea", { title: idea.title, description: idea.body?.slice(0, 100) })}
              >
                <Lightbulb className="h-2.5 w-2.5 text-[#FFD60A] shrink-0" />
                <span className="truncate">{idea.title}</span>
              </button>
            ))}
            {projectNotes.map((note: any) => (
              <button
                key={note.id}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-accent text-left"
                onClick={() => addNode("note", { title: note.title, description: note.contentPlain?.slice(0, 100) })}
              >
                <StickyNote className="h-2.5 w-2.5 text-[#30BCED] shrink-0" />
                <span className="truncate">{note.title}</span>
              </button>
            ))}
            {projectScripts.map((script: any) => (
              <button
                key={script.id}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-accent text-left"
                onClick={() => addNode("script", { title: script.title, description: script.contentPlain?.slice(0, 100) })}
              >
                <FileText className="h-2.5 w-2.5 text-[#2EC4B6] shrink-0" />
                <span className="truncate">{script.title}</span>
              </button>
            ))}
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
    </div>
  );
}
