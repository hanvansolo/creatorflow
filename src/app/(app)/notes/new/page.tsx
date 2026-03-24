import { NoteEditorPage } from "@/components/notes/note-editor-page";
import { createNoteAction } from "../actions";

export default function NewNotePage() {
  return <NoteEditorPage createAction={createNoteAction} />;
}
