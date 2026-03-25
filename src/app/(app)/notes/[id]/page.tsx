import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { NoteEditorPage } from "@/components/notes/note-editor-page";
import { BacklinksPanel } from "@/components/shared/backlinks-panel";
import { getNoteById } from "@/lib/services/notes";
import { getItemTags } from "@/lib/services/tags";
import { getBacklinks } from "@/lib/services/links";
import { createNoteAction, updateNoteAction, deleteNoteAction } from "../actions";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const [note, tags, backlinks] = await Promise.all([
    getNoteById(userId, id),
    getItemTags(id, "note"),
    getBacklinks(userId, id, "note"),
  ]);

  if (!note) notFound();

  return (
    <div className="space-y-6">
      <NoteEditorPage
        note={note}
        tags={tags.map((t) => t.name)}
        createAction={createNoteAction}
        updateAction={updateNoteAction}
        deleteAction={deleteNoteAction}
      />
      <BacklinksPanel backlinks={backlinks} />
    </div>
  );
}
