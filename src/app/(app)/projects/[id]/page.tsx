"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { deleteProjectAction } from "../actions";

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

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => { setProject(data); setLoading(false); })
      .catch(() => { setLoading(false); router.push("/projects"); });
  }, [id, router]);

  if (loading || !project) return null;

  const handleDelete = async () => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await deleteProjectAction(id);
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
        <Button variant="ghost" size="icon-sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Kanban Board */}
      <KanbanBoard projectId={id} />
    </div>
  );
}
