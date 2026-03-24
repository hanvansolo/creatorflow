import { db } from "@/lib/db";
import { ideas, itemTags, tags } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";

export async function getIdeas(userId: string, search?: string) {
  const conditions = [eq(ideas.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(ideas.title, `%${search}%`),
        ilike(ideas.body, `%${search}%`)
      )!
    );
  }

  return db.query.ideas.findMany({
    where: and(...conditions),
    orderBy: [desc(ideas.createdAt)],
    with: {
      project: true,
    },
  });
}

export async function getIdeaById(userId: string, id: string) {
  return db.query.ideas.findFirst({
    where: and(eq(ideas.id, id), eq(ideas.userId, userId)),
    with: {
      project: true,
    },
  });
}

export async function createIdea(
  userId: string,
  data: {
    title: string;
    body?: string;
    status?: string;
    projectId?: string | null;
  }
) {
  const [idea] = await db
    .insert(ideas)
    .values({
      userId,
      title: data.title,
      body: data.body,
      status: data.status || "new",
      projectId: data.projectId || null,
    })
    .returning();

  return idea;
}

export async function updateIdea(
  userId: string,
  id: string,
  data: {
    title?: string;
    body?: string;
    status?: string;
    projectId?: string | null;
  }
) {
  const [idea] = await db
    .update(ideas)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
    .returning();

  return idea;
}

export async function deleteIdea(userId: string, id: string) {
  await db
    .delete(ideas)
    .where(and(eq(ideas.id, id), eq(ideas.userId, userId)));
}

export async function getIdeaTagNames(ideaId: string) {
  const results = await db
    .select({ name: tags.name, color: tags.color, id: tags.id })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(and(eq(itemTags.itemId, ideaId), eq(itemTags.itemType, "idea")));

  return results;
}
