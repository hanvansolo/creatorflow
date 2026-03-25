"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Pin, Star } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDistanceToNow } from "@/lib/utils";
import { toast } from "sonner";

const stickyColors = [
  { bg: "bg-yellow-100 dark:bg-yellow-500/10", border: "border-yellow-200/80 dark:border-yellow-500/20", pin: "text-yellow-600 dark:text-yellow-400" },
  { bg: "bg-blue-100 dark:bg-blue-500/10", border: "border-blue-200/80 dark:border-blue-500/20", pin: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-green-100 dark:bg-green-500/10", border: "border-green-200/80 dark:border-green-500/20", pin: "text-green-600 dark:text-green-400" },
  { bg: "bg-pink-100 dark:bg-pink-500/10", border: "border-pink-200/80 dark:border-pink-500/20", pin: "text-pink-600 dark:text-pink-400" },
  { bg: "bg-purple-100 dark:bg-purple-500/10", border: "border-purple-200/80 dark:border-purple-500/20", pin: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-orange-100 dark:bg-orange-500/10", border: "border-orange-200/80 dark:border-orange-500/20", pin: "text-orange-600 dark:text-orange-400" },
  { bg: "bg-cyan-100 dark:bg-cyan-500/10", border: "border-cyan-200/80 dark:border-cyan-500/20", pin: "text-cyan-600 dark:text-cyan-400" },
  { bg: "bg-rose-100 dark:bg-rose-500/10", border: "border-rose-200/80 dark:border-rose-500/20", pin: "text-rose-600 dark:text-rose-400" },
];

function getColor(index: number) {
  return stickyColors[index % stickyColors.length];
}

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

  const togglePin = async (e: React.MouseEvent, noteId: string, currentPinned: boolean) => {
    e.stopPropagation();
    const res = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: noteId, itemType: "note", pinned: currentPinned }),
    });
    if (res.ok) {
      const { pinned } = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, pinned } : n))
      );
      toast.success(pinned ? "Note pinned" : "Note unpinned");
    }
  };

  // Sort: pinned first, then by date
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const pinnedNotes = sorted.filter((n) => n.pinned);
  const unpinnedNotes = sorted.filter((n) => !n.pinned);

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
        <div className="space-y-6">
          {/* Pinned section */}
          {pinnedNotes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2 px-1">
                <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Pinned</span>
              </div>
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                {pinnedNotes.map((note: any, index: number) => (
                  <StickyNoteCard
                    key={note.id}
                    note={note}
                    index={index}
                    onPin={togglePin}
                    onClick={() => router.push(`/notes/${note.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <div className="mb-3 flex items-center gap-2 px-1">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">All Notes</span>
                </div>
              )}
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                {unpinnedNotes.map((note: any, index: number) => (
                  <StickyNoteCard
                    key={note.id}
                    note={note}
                    index={index + pinnedNotes.length}
                    onPin={togglePin}
                    onClick={() => router.push(`/notes/${note.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StickyNoteCard({
  note,
  index,
  onPin,
  onClick,
}: {
  note: any;
  index: number;
  onPin: (e: React.MouseEvent, id: string, pinned: boolean) => void;
  onClick: () => void;
}) {
  const color = getColor(index);
  const rotation = note.pinned ? "rotate-0" : getRotation(index);
  const preview = note.contentPlain?.slice(0, 200);

  return (
    <div
      onClick={onClick}
      className={`
        group mb-4 break-inside-avoid cursor-pointer rounded-lg border p-4 shadow-sm
        transition-all duration-200
        hover:shadow-lg hover:scale-[1.02] hover:rotate-0 hover:-translate-y-1
        ${color.bg} ${color.border} ${rotation}
        ${note.pinned ? "ring-2 ring-amber-400/40 dark:ring-amber-400/20" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <Pin className={`h-3.5 w-3.5 ${note.pinned ? "text-amber-500 fill-amber-500" : `${color.pin} opacity-40`}`} />
        <button
          onClick={(e) => onPin(e, note.id, note.pinned)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title={note.pinned ? "Unpin" : "Pin"}
        >
          <Star
            className={`h-3.5 w-3.5 transition-colors ${
              note.pinned
                ? "text-amber-500 fill-amber-500"
                : "text-muted-foreground/40 hover:text-amber-500"
            }`}
          />
        </button>
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

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-foreground/5 flex items-center justify-between">
        {note.project ? (
          <span className="text-[10px] font-medium text-foreground/40">
            {note.project.title}
          </span>
        ) : (
          <span />
        )}
        <span className="text-[10px] text-muted-foreground/50">
          {formatDistanceToNow(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}
