"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const typeColors: Record<string, string> = {
  idea: "#FFD60A",
  note: "#30BCED",
  script: "#2EC4B6",
  project: "#9B5DE5",
};

const typeLabels: Record<string, string> = {
  idea: "Idea",
  note: "Note",
  script: "Script",
  project: "Project",
};

const typeHrefs: Record<string, (id: string) => string> = {
  idea: (id) => `/ideas/${id}`,
  note: (id) => `/notes/${id}`,
  script: (id) => `/scripts/${id}`,
  project: (id) => `/projects/${id}`,
};

type GraphNode = {
  id: string;
  type: string;
  title: string;
  pinned?: boolean;
  status?: string;
  // Force graph adds these
  x?: number;
  y?: number;
};

type GraphEdge = {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
};

export default function GraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((data) => {
        setGraphData({ nodes: data.nodes, edges: data.edges });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleNodeClick = useCallback(
    (node: any) => {
      const href = typeHrefs[node.type]?.(node.id);
      if (href) router.push(href);
    },
    [router]
  );

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() * 0.7, 300);
  const handleReset = () => graphRef.current?.zoomToFit(400, 60);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.title || "";
    const fontSize = Math.max(11 / globalScale, 2);
    const nodeRadius = node.type === "project" ? 8 : 5;
    const color = typeColors[node.type] || "#888";

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Glow for pinned items
    if (node.pinned) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 / globalScale;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Label
    if (globalScale > 0.6) {
      const maxLen = globalScale > 2 ? 40 : 20;
      const displayLabel = label.length > maxLen ? label.slice(0, maxLen) + "…" : label;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = hoveredNode?.id === node.id ? "#fff" : "rgba(255,255,255,0.7)";
      ctx.fillText(displayLabel, node.x, node.y + nodeRadius + 3);
    }
  }, [hoveredNode]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const source = link.source;
    const target = link.target;
    if (!source?.x || !target?.x) return;

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Knowledge Graph"
          description="Visualize connections between your ideas, notes, scripts, and projects"
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Object.entries(typeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: typeColors[type] }} />
                <span className="text-[11px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon-sm" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={handleReset} title="Fit to screen">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={toggleFullscreen} title="Fullscreen">
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>

        {hoveredNode && (
          <div className="ml-4 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: typeColors[hoveredNode.type] }} />
            <span className="text-sm font-medium">{hoveredNode.title}</span>
            <Badge variant="secondary" className="text-[10px] capitalize">{hoveredNode.type}</Badge>
          </div>
        )}
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className="rounded-xl border border-border/50 bg-[#0a0a0f] overflow-hidden"
        style={{ height: isFullscreen ? "100vh" : "calc(100vh - 16rem)" }}
      >
        {!loading && graphData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No content yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create ideas and projects to see your knowledge graph</p>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={{ nodes: graphData.nodes, links: graphData.edges }}
            nodeCanvasObject={nodeCanvasObject}
            linkCanvasObjectMode={() => "replace"}
            linkCanvasObject={linkCanvasObject}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoveredNode(node || null)}
            backgroundColor="#0a0a0f"
            nodeRelSize={6}
            linkDirectionalParticles={1}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={() => "rgba(255,255,255,0.15)"}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={50}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 60)}
          />
        )}
      </div>
    </div>
  );
}
