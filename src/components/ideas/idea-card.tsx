"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import type { Idea, Project } from "@/types";

interface IdeaCardProps {
  idea: Idea & { project?: Project | null };
  tags?: { name: string }[];
}

export function IdeaCard({ idea, tags }: IdeaCardProps) {
  return (
    <Link href={`/ideas/${idea.id}`}>
      <Card className="group cursor-pointer transition-colors hover:bg-accent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{idea.title}</h3>
              {idea.body && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {idea.body}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={idea.status} />
                {idea.project && (
                  <Badge variant="outline" className="text-xs">
                    {idea.project.title}
                  </Badge>
                )}
                {tags?.map((tag) => (
                  <Badge
                    key={tag.name}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(idea.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
