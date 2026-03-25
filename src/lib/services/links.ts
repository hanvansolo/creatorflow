import { db } from "@/lib/db";
import { ideas, notes, scripts } from "@/lib/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export type LinkableItem = {
  id: string;
  title: string;
  type: "idea" | "note" | "script";
};

/**
 * Search all content items by title for internal linking.
 */
export async function searchLinkableItems(
  userId: string,
  query: string
): Promise<LinkableItem[]> {
  if (!query.trim()) return [];

  const term = `%${query}%`;

  const [matchedIdeas, matchedNotes, matchedScripts] = await Promise.all([
    db.query.ideas.findMany({
      where: ilike(ideas.title, term),
      columns: { id: true, title: true },
      limit: 5,
    }),
    db.query.notes.findMany({
      where: ilike(notes.title, term),
      columns: { id: true, title: true },
      limit: 5,
    }),
    db.query.scripts.findMany({
      where: ilike(scripts.title, term),
      columns: { id: true, title: true },
      limit: 5,
    }),
  ]);

  return [
    ...matchedIdeas.map((i) => ({ id: i.id, title: i.title, type: "idea" as const })),
    ...matchedNotes.map((n) => ({ id: n.id, title: n.title, type: "note" as const })),
    ...matchedScripts.map((s) => ({ id: s.id, title: s.title, type: "script" as const })),
  ];
}

/**
 * Find backlinks: items whose HTML content links to a given item.
 */
export async function getBacklinks(
  userId: string,
  itemId: string,
  itemType: string
): Promise<LinkableItem[]> {
  const linkPattern = `%/\${itemType}s/${itemId}%`;
  const results: LinkableItem[] = [];

  const [linkedIdeas, linkedNotes, linkedScripts] = await Promise.all([
    db.query.ideas.findMany({
      where: ilike(ideas.body, `%/${itemType}s/${itemId}%`),
      columns: { id: true, title: true },
    }),
    db.query.notes.findMany({
      where: ilike(notes.content, `%/${itemType}s/${itemId}%`),
      columns: { id: true, title: true },
    }),
    db.query.scripts.findMany({
      where: ilike(scripts.content, `%/${itemType}s/${itemId}%`),
      columns: { id: true, title: true },
    }),
  ]);

  // Filter out self-references
  for (const i of linkedIdeas) {
    if (i.id !== itemId) results.push({ id: i.id, title: i.title, type: "idea" });
  }
  for (const n of linkedNotes) {
    if (n.id !== itemId) results.push({ id: n.id, title: n.title, type: "note" });
  }
  for (const s of linkedScripts) {
    if (s.id !== itemId) results.push({ id: s.id, title: s.title, type: "script" });
  }

  return results;
}
