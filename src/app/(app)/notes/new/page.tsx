"use client";

import dynamic from "next/dynamic";
import { createNoteAction } from "../actions";

const NoteEditorPage = dynamic(
  () => import("@/components/notes/note-editor-page").then((m) => m.NoteEditorPage),
  { ssr: false }
);

export default function NewNotePage() {
  return <NoteEditorPage createAction={createNoteAction} />;
}
