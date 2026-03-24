import { auth } from "@clerk/nextjs/server";
import { StickyNote } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { getNotes } from "@/lib/services/notes";
import { getItemTags } from "@/lib/services/tags";

export default async function NotesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const allNotes = await getNotes(userId);

  const notesWithTags = await Promise.all(
    allNotes.map(async (note) => ({
      note,
      tags: await getItemTags(note.id, "note"),
    }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Write and organize your research and thoughts"
        actionLabel="New Note"
        actionHref="/notes/new"
      />

      {allNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Create notes to capture research, thoughts, and reference material for your content."
          actionLabel="Write your first note"
          actionHref="/notes/new"
        />
      ) : (
        <div className="grid gap-3">
          {notesWithTags.map(({ note, tags }) => (
            <NoteCard key={note.id} note={note} tags={tags} />
          ))}
        </div>
      )}
    </div>
  );
}
