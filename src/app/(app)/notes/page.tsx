"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Pin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDistanceToNow } from "@/lib/utils";

const stickyColors = [
  { bg: "bg-yellow-100 dark:bg-yellow-500/10", border: "border-yellow-200/80 dark:border-yellow-500/20", pin: "text-yellow-500" },
  { bg: "bg-blue-100 dark:bg-blue-500/10", border: "border-blue-200/80 dark:border-blue-500/20", pin: "text-blue-500" },
  { bg: "bg-green-100 dark:bg-green-500/10", border: "border-green-200/80 dark:border-green-500/20", pin: "text-green-500" },
  { bg: "bg-pink-100 dark:bg-pink-500/10", border: "border-pink-200/80 dark:border-pink-500/20", pin: "text-pink-500" },
  { bg: "bg-purple-100 dark:bg-purple-500/10", border: "border-purple-200/80 dark:border-purple-500/20", pin: "text-purple-500" },
  { bg: "bg-orange-100 dark:bg-orange-500/10", border: "border-orange-200/80 dark:border-orange-500/20", pin: "text-orange-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-500/10", border: "border-cyan-200/80 dark:border-cyan-500/20", pin: "text-cyan-500" },
  { bg: "bg-rose-100 dark:bg-rose-500/10", border: "border-rose-200/80 dark:border-rose-500/20", pin: "text-rose-500" },
];

function getColor(index: number) {
  return stickyColors[index % stickyColors.length];
}

// Slight random rotation for sticky note feel
function getRotation(index: number) {
  const rotations = ["-rotate-1", "rotate-1", "-rotate-[0.5deg]", "rotate-[0.5deg]", "rotate-0", "-rotate-[1.5deg]", "rotate-[1.5deg]", "rotate-0"];
  return rotations[index % rotations.length];
}

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
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {notes.map((note: any, index: number) => {
            const color = getColor(index);
            const rotation = getRotation(index);
            const preview = note.contentPlain?.slice(0, 200);

            return (
              <div
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className={`
                  group mb-4 break-inside-avoid cursor-pointer rounded-lg border p-4 shadow-sm
                  transition-all duration-200
                  hover:shadow-lg hover:scale-[1.02] hover:rotate-0 hover:-translate-y-1
                  ${color.bg} ${color.border} ${rotation}
                `}
              >
                {/* Pin */}
                <div className="flex items-start justify-between mb-2">
                  <Pin className={`h-3.5 w-3.5 ${color.pin} opacity-60`} />
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(note.updatedAt)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[13px] leading-snug text-foreground/90">
                  {note.title}
                </h3>

                {/* Preview */}
                {preview && (
                  <p className="mt-2 text-[12px] leading-relaxed text-foreground/60 line-clamp-6">
                    {preview}
                  </p>
                )}

                {/* Project badge */}
                {note.project && (
                  <div className="mt-3 pt-2 border-t border-foreground/5">
                    <span className="text-[10px] font-medium text-foreground/40">
                      {note.project.title}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
