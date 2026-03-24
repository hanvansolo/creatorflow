"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import type { Note, Project, Folder } from "@/types";

interface NoteCardProps {
  note: Note & { project?: Project | null; folder?: Folder | null };
  tags?: { name: string }[];
}

export function NoteCard({ note, tags }: NoteCardProps) {
  const preview = note.contentPlain?.slice(0, 120);

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="group cursor-pointer transition-colors hover:bg-accent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{note.title}</h3>
              {preview && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {preview}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {note.project && (
                  <Badge variant="outline" className="text-xs">
                    {note.project.title}
                  </Badge>
                )}
                {note.folder && (
                  <Badge variant="secondary" className="text-xs">
                    {note.folder.name}
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
              {formatDistanceToNow(note.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
