import { db } from "@/lib/db";
import { ideas, notes, scripts, files } from "@/lib/db/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";

export type SearchResult = {
  id: string;
  type: "idea" | "note" | "script" | "file";
  title: string;
  preview?: string;
  status?: string;
  updatedAt: Date;
};

export async function globalSearch(
  userId: string,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const term = `%${query}%`;

  const [matchedIdeas, matchedNotes, matchedScripts, matchedFiles] =
    await Promise.all([
      db.query.ideas.findMany({
        where: and(
          eq(ideas.userId, userId),
          or(ilike(ideas.title, term), ilike(ideas.body, term))
        ),
        orderBy: [desc(ideas.createdAt)],
        limit: 10,
      }),
      db.query.notes.findMany({
        where: and(
          eq(notes.userId, userId),
          or(ilike(notes.title, term), ilike(notes.contentPlain, term))
        ),
        orderBy: [desc(notes.updatedAt)],
        limit: 10,
      }),
      db.query.scripts.findMany({
        where: and(
          eq(scripts.userId, userId),
          or(ilike(scripts.title, term), ilike(scripts.contentPlain, term))
        ),
        orderBy: [desc(scripts.updatedAt)],
        limit: 10,
      }),
      db.query.files.findMany({
        where: and(
          eq(files.userId, userId),
          or(ilike(files.name, term), ilike(files.originalName, term))
        ),
        orderBy: [desc(files.createdAt)],
        limit: 10,
      }),
    ]);

  const results: SearchResult[] = [
    ...matchedIdeas.map((i) => ({
      id: i.id,
      type: "idea" as const,
      title: i.title,
      preview: i.body?.slice(0, 120),
      status: i.status,
      updatedAt: i.updatedAt,
    })),
    ...matchedNotes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      preview: n.contentPlain?.slice(0, 120),
      updatedAt: n.updatedAt,
    })),
    ...matchedScripts.map((s) => ({
      id: s.id,
      type: "script" as const,
      title: s.title,
      preview: s.contentPlain?.slice(0, 120),
      status: s.status,
      updatedAt: s.updatedAt,
    })),
    ...matchedFiles.map((f) => ({
      id: f.id,
      type: "file" as const,
      title: f.originalName,
      updatedAt: f.updatedAt,
    })),
  ];

  // Sort by most recent
  results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return results.slice(0, 20);
}
