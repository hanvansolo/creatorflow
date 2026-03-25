"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, Trash2, Sparkles, Search, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteProjectAction } from "../actions";
import { AIActionMenu, projectActions } from "@/components/ai/ai-action-menu";
import { AISwipeBoard } from "@/components/board/swipe-board";
import { toast } from "sonner";

const KanbanBoard = dynamic(
  () => import("@/components/board/kanban-board").then((m) => m.KanbanBoard),
  { ssr: false }
);

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [researchOpen, setResearchOpen] = useState(false);
  const [researchTopic, setResearchTopic] = useState("");
  const [researching, setResearching] = useState(false);
  const [swipeMode, setSwipeMode] = useState(false);
  const boardRef = useRef<{ refresh: () => void } | null>(null);

  const fetchProject = () => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => { setProject(data); setLoading(false); })
      .catch(() => { setLoading(false); router.push("/projects"); });
  };

  useEffect(() => { fetchProject(); }, [id]);

  if (loading || !project) return null;

  const handleDelete = async () => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await deleteProjectAction(id);
  };

  const handleResearch = async () => {
    if (!researchTopic.trim()) return;
    setResearching(true);
    toast.info("AI is researching... this may take a moment");

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: researchTopic, projectId: id }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Research complete! Saved as note + ${data.tasksCreated} tasks added to Backlog + added to Canvas`);
        setResearchOpen(false);
        setResearchTopic("");
        // Refresh the board to show new tasks
        boardRef.current?.refresh?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Research failed");
      }
    } catch {
      toast.error("Research failed");
    }
    setResearching(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <ChevronRight className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <AIActionMenu
            actions={projectActions}
            context={`Project: ${project.title}\n${project.description || ""}`}
            projectId={id}
            buttonVariant="outline"
            buttonSize="default"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSwipeMode(true)}
            className="gap-1.5 text-[#9B5DE5] border-[#9B5DE5]/30 hover:bg-[#9B5DE5]/10 hover:text-[#9B5DE5]"
          >
            <Zap className="h-3.5 w-3.5" />
            Suggest
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResearchOpen(true)}
            className="gap-1.5 text-[#F72585] border-[#F72585]/30 hover:bg-[#F72585]/10 hover:text-[#F72585]"
          >
            <Search className="h-3.5 w-3.5" />
            Research
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      {swipeMode ? (
        <AISwipeBoard
          projectId={id}
          projectTitle={project.title}
          onComplete={() => {
            setSwipeMode(false);
            fetchProject();
          }}
        />
      ) : (
        <KanbanBoard projectId={id} />
      )}

      {/* Research Dialog */}
      <Dialog open={researchOpen} onOpenChange={setResearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#F72585]" />
              AI Deep Research
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[13px] text-muted-foreground">
              AI will research this topic and automatically:
            </p>
            <ul className="text-[12px] text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Save findings as a project note</li>
              <li>Generate tasks from the research → Backlog</li>
              <li>Add a research card to the Canvas</li>
            </ul>
            <Input
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleResearch()}
              placeholder="What do you want to research?"
              autoFocus
              disabled={researching}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setResearchOpen(false)} disabled={researching}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleResearch}
                disabled={researching || !researchTopic.trim()}
                className="bg-[#F72585] hover:bg-[#F72585]/90 text-white"
              >
                {researching ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Researching...</>
                ) : (
                  <><Search className="mr-1.5 h-3.5 w-3.5" /> Research</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
