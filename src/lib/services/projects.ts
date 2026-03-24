import { db } from "@/lib/db";
import { projects, ideas, notes, scripts, files } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, count } from "drizzle-orm";

export async function getProjects(userId: string, search?: string) {
  const conditions = [eq(projects.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(projects.title, `%${search}%`),
        ilike(projects.description, `%${search}%`)
      )!
    );
  }

  return db.query.projects.findMany({
    where: and(...conditions),
    orderBy: [desc(projects.updatedAt)],
  });
}

export async function getProjectById(userId: string, id: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId)),
    with: {
      ideas: { orderBy: [desc(ideas.createdAt)] },
      notes: { orderBy: [desc(notes.updatedAt)] },
      scripts: { orderBy: [desc(scripts.updatedAt)] },
      files: { orderBy: [desc(files.createdAt)] },
    },
  });
}

export async function createProject(
  userId: string,
  data: {
    title: string;
    description?: string;
    status?: string;
    color?: string;
  }
) {
  const [project] = await db
    .insert(projects)
    .values({
      userId,
      title: data.title,
      description: data.description,
      status: data.status || "active",
      color: data.color,
    })
    .returning();

  return project;
}

export async function updateProject(
  userId: string,
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    color?: string;
  }
) {
  const [project] = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  return project;
}

export async function deleteProject(userId: string, id: string) {
  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function getProjectsForSelect(userId: string) {
  return db.query.projects.findMany({
    where: eq(projects.userId, userId),
    columns: { id: true, title: true },
    orderBy: [desc(projects.updatedAt)],
  });
}
