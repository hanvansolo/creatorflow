import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";

export async function getNotes(userId: string, search?: string) {
  const conditions = [eq(notes.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(notes.title, `%${search}%`),
        ilike(notes.contentPlain, `%${search}%`)
      )!
    );
  }

  return db.query.notes.findMany({
    where: and(...conditions),
    orderBy: [desc(notes.updatedAt)],
    with: {
      project: true,
      folder: true,
    },
  });
}

export async function getNoteById(userId: string, id: string) {
  return db.query.notes.findFirst({
    where: and(eq(notes.id, id), eq(notes.userId, userId)),
    with: {
      project: true,
      folder: true,
    },
  });
}

export async function createNote(
  userId: string,
  data: {
    title: string;
    content?: string;
    contentPlain?: string;
    projectId?: string | null;
    folderId?: string | null;
  }
) {
  const [note] = await db
    .insert(notes)
    .values({
      userId,
      title: data.title,
      content: data.content,
      contentPlain: data.contentPlain,
      projectId: data.projectId || null,
      folderId: data.folderId || null,
    })
    .returning();

  return note;
}

export async function updateNote(
  userId: string,
  id: string,
  data: {
    title?: string;
    content?: string;
    contentPlain?: string;
    projectId?: string | null;
    folderId?: string | null;
  }
) {
  const [note] = await db
    .update(notes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();

  return note;
}

export async function deleteNote(userId: string, id: string) {
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
}
