"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { createNoteAction } from "../actions";

const NoteEditorPage = dynamic(
  () => import("@/components/notes/note-editor-page").then((m) => m.NoteEditorPage),
  { ssr: false }
);

export default function NewNotePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || undefined;

  return <NoteEditorPage createAction={createNoteAction} defaultProjectId={projectId} />;
}
