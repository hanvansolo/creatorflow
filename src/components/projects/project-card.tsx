"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";
import type { Project } from "@/types";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group cursor-pointer transition-colors hover:bg-accent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
                  colorMap[project.color || "blue"] || "bg-blue-500"
                }`}
              />
              <div className="min-w-0">
                <h3 className="font-medium truncate">{project.title}</h3>
                {project.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="mt-2">
                  <StatusBadge status={project.status} />
                </div>
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(project.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
