"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500", purple: "bg-purple-500", green: "bg-green-500",
  orange: "bg-orange-500", pink: "bg-pink-500", yellow: "bg-yellow-500",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Group your ideas, notes, scripts, and files together"
        actionLabel="New Project"
        actionHref="/projects/new"
      />

      {!loading && projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Projects help you organize related ideas, notes, scripts, and files in one place."
          actionLabel="Create your first project"
          actionHref="/projects/new"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project: any) => (
            <Card
              key={project.id}
              className="group cursor-pointer transition-colors hover:bg-accent"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${colorMap[project.color] || "bg-blue-500"}`} />
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{project.title}</h3>
                    {project.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={project.status} />
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(project.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
