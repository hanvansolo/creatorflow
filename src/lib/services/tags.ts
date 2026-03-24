import { db } from "@/lib/db";
import { tags, itemTags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ItemType } from "@/types";

export async function getOrCreateTag(userId: string, name: string) {
  const normalized = name.trim().toLowerCase();

  const existing = await db.query.tags.findFirst({
    where: and(eq(tags.userId, userId), eq(tags.name, normalized)),
  });

  if (existing) return existing;

  const [tag] = await db
    .insert(tags)
    .values({ userId, name: normalized })
    .returning();

  return tag;
}

export async function syncItemTags(
  userId: string,
  itemId: string,
  itemType: ItemType,
  tagNames: string[]
) {
  // Remove existing tags for this item
  await db
    .delete(itemTags)
    .where(and(eq(itemTags.itemId, itemId), eq(itemTags.itemType, itemType)));

  if (tagNames.length === 0) return;

  // Get or create all tags
  const tagRecords = await Promise.all(
    tagNames.map((name) => getOrCreateTag(userId, name))
  );

  // Insert junction records
  await db.insert(itemTags).values(
    tagRecords.map((tag) => ({
      tagId: tag.id,
      itemId,
      itemType,
    }))
  );
}

export async function getUserTags(userId: string) {
  return db.query.tags.findMany({
    where: eq(tags.userId, userId),
  });
}

export async function getItemTags(itemId: string, itemType: ItemType) {
  const results = await db
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(and(eq(itemTags.itemId, itemId), eq(itemTags.itemType, itemType)));

  return results;
}
