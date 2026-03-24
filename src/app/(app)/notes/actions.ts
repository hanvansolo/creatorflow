"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNoteSchema, updateNoteSchema } from "@/lib/validations/notes";
import * as notesService from "@/lib/services/notes";
import { syncItemTags } from "@/lib/services/tags";

export async function createNoteAction(data: {
  title: string;
  content?: string;
  contentPlain?: string;
  projectId?: string | null;
  tags?: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = createNoteSchema.parse(data);
  const note = await notesService.createNote(userId, validated);

  if (data.tags && data.tags.length > 0) {
    await syncItemTags(userId, note.id, "note", data.tags);
  }

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return note;
}

export async function updateNoteAction(
  id: string,
  data: {
    title?: string;
    content?: string;
    contentPlain?: string;
    projectId?: string | null;
    tags?: string[];
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = updateNoteSchema.parse(data);
  await notesService.updateNote(userId, id, validated);

  if (data.tags) {
    await syncItemTags(userId, id, "note", data.tags);
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteNoteAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await notesService.deleteNote(userId, id);

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  redirect("/notes");
}
