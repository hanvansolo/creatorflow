import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { NoteEditorPage } from "@/components/notes/note-editor-page";
import { getNoteById } from "@/lib/services/notes";
import { getItemTags } from "@/lib/services/tags";
import { createNoteAction, updateNoteAction, deleteNoteAction } from "../actions";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const note = await getNoteById(userId, id);
  if (!note) notFound();

  const tags = await getItemTags(id, "note");

  return (
    <NoteEditorPage
      note={note}
      tags={tags.map((t) => t.name)}
      createAction={createNoteAction}
      updateAction={updateNoteAction}
      deleteAction={deleteNoteAction}
    />
  );
}
