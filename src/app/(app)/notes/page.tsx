"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StickyNote } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Write and organize your research and thoughts"
        actionLabel="New Note"
        actionHref="/notes/new"
      />

      {!loading && notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Create notes to capture research, thoughts, and reference material for your content."
          actionLabel="Write your first note"
          actionHref="/notes/new"
        />
      ) : (
        <div className="grid gap-3">
          {notes.map((note: any) => (
            <Card
              key={note.id}
              className="group cursor-pointer transition-colors hover:bg-accent"
              onClick={() => router.push(`/notes/${note.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{note.title}</h3>
                    {note.contentPlain && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {note.contentPlain.slice(0, 120)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(note.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
