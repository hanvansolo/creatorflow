import { db } from "@/lib/db";
import { scripts } from "@/lib/db/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { wordCount, stripHtml } from "@/lib/utils";

export async function getScripts(userId: string, search?: string) {
  const conditions = [eq(scripts.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(scripts.title, `%${search}%`),
        ilike(scripts.contentPlain, `%${search}%`)
      )!
    );
  }

  return db.query.scripts.findMany({
    where: and(...conditions),
    orderBy: [desc(scripts.updatedAt)],
    with: {
      project: true,
      idea: true,
    },
  });
}

export async function getScriptById(userId: string, id: string) {
  return db.query.scripts.findFirst({
    where: and(eq(scripts.id, id), eq(scripts.userId, userId)),
    with: {
      project: true,
      idea: true,
    },
  });
}

export async function createScript(
  userId: string,
  data: {
    title: string;
    content?: string;
    contentPlain?: string;
    status?: string;
    projectId?: string | null;
    ideaId?: string | null;
  }
) {
  const wc = data.contentPlain ? wordCount(data.contentPlain) : 0;

  const [script] = await db
    .insert(scripts)
    .values({
      userId,
      title: data.title,
      content: data.content,
      contentPlain: data.contentPlain,
      status: data.status || "draft",
      projectId: data.projectId || null,
      ideaId: data.ideaId || null,
      wordCount: wc,
    })
    .returning();

  return script;
}

export async function updateScript(
  userId: string,
  id: string,
  data: {
    title?: string;
    content?: string;
    contentPlain?: string;
    status?: string;
    projectId?: string | null;
    ideaId?: string | null;
  }
) {
  const wc = data.contentPlain ? wordCount(data.contentPlain) : undefined;

  const [script] = await db
    .update(scripts)
    .set({
      ...data,
      wordCount: wc,
      updatedAt: new Date(),
    })
    .where(and(eq(scripts.id, id), eq(scripts.userId, userId)))
    .returning();

  return script;
}

export async function deleteScript(userId: string, id: string) {
  await db
    .delete(scripts)
    .where(and(eq(scripts.id, id), eq(scripts.userId, userId)));
}
