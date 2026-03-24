import { db } from "@/lib/db";
import { ideas, notes, scripts, projects } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function getDashboardStats(userId: string) {
  const [ideasCount] = await db
    .select({ count: count() })
    .from(ideas)
    .where(eq(ideas.userId, userId));

  const [notesCount] = await db
    .select({ count: count() })
    .from(notes)
    .where(eq(notes.userId, userId));

  const [scriptsCount] = await db
    .select({ count: count() })
    .from(scripts)
    .where(eq(scripts.userId, userId));

  const [projectsCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  return {
    ideas: ideasCount.count,
    notes: notesCount.count,
    scripts: scriptsCount.count,
    projects: projectsCount.count,
  };
}

export async function getRecentItems(userId: string) {
  const recentIdeas = await db.query.ideas.findMany({
    where: eq(ideas.userId, userId),
    orderBy: [desc(ideas.createdAt)],
    limit: 5,
  });

  const recentNotes = await db.query.notes.findMany({
    where: eq(notes.userId, userId),
    orderBy: [desc(notes.updatedAt)],
    limit: 5,
  });

  const recentScripts = await db.query.scripts.findMany({
    where: eq(scripts.userId, userId),
    orderBy: [desc(scripts.updatedAt)],
    limit: 5,
  });

  return { recentIdeas, recentNotes, recentScripts };
}
