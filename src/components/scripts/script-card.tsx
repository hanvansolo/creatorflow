"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";
import type { Script, Project, Idea } from "@/types";

interface ScriptCardProps {
  script: Script & { project?: Project | null; idea?: Idea | null };
  tags?: { name: string }[];
}

export function ScriptCard({ script, tags }: ScriptCardProps) {
  const preview = script.contentPlain?.slice(0, 120);

  return (
    <Link href={`/scripts/${script.id}`}>
      <Card className="group cursor-pointer transition-colors hover:bg-accent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{script.title}</h3>
              {preview && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {preview}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={script.status} />
                <Badge variant="secondary" className="text-xs">
                  {script.wordCount} words
                </Badge>
                {script.project && (
                  <Badge variant="outline" className="text-xs">
                    {script.project.title}
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
              {formatDistanceToNow(script.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
