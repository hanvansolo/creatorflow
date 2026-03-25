"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNoteSchema, updateNoteSchema } from "@/lib/validations/notes";
import * as notesService from "@/lib/services/notes";
import { syncItemTags } from "@/lib/services/tags";

async function tryIndex(userId: string, itemId: string, text: string, title: string) {
  try {
    const { indexContent } = await import("@/lib/ai/embeddings");
    await indexContent(userId, itemId, "note", text, title);
  } catch {}
}

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

  tryIndex(userId, note.id, validated.contentPlain || "", validated.title).catch(() => {});

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

  tryIndex(userId, id, data.contentPlain || "", data.title || "").catch(() => {});

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteNoteAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await notesService.deleteNote(userId, id);

  try {
    const { removeContentEmbeddings } = await import("@/lib/ai/embeddings");
    await removeContentEmbeddings(id, "note");
  } catch {}

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  redirect("/notes");
}
