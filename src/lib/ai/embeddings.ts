import { db } from "@/lib/db";
import { contentEmbeddings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOpenAI } from "./provider";
import { chunkText } from "./chunker";
import type { ItemType } from "@/types";

/**
 * Generate embeddings for a single text using OpenAI.
 */
async function embed(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Index a content item: chunk the text, embed each chunk, and store in DB.
 * Deletes old embeddings for the item first (handles updates).
 */
export async function indexContent(
  userId: string,
  itemId: string,
  itemType: ItemType,
  text: string,
  title: string
) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, skipping embedding");
    return;
  }

  // Delete existing embeddings for this item
  await db
    .delete(contentEmbeddings)
    .where(
      and(
        eq(contentEmbeddings.itemId, itemId),
        eq(contentEmbeddings.itemType, itemType)
      )
    );

  // Prepend title for better context in embeddings
  const fullText = `${title}\n\n${text}`.trim();
  if (!fullText) return;

  const chunks = chunkText(fullText);

  // Embed all chunks in parallel (batch if needed for rate limits)
  const embeddings = await Promise.all(chunks.map((chunk) => embed(chunk)));

  // Store all chunks with embeddings
  if (chunks.length > 0) {
    await db.insert(contentEmbeddings).values(
      chunks.map((chunk, index) => ({
        userId,
        itemId,
        itemType,
        chunkIndex: index,
        chunkText: chunk,
        embedding: embeddings[index],
      }))
    );
  }
}

/**
 * Remove all embeddings for an item (on delete).
 */
export async function removeContentEmbeddings(
  itemId: string,
  itemType: ItemType
) {
  await db
    .delete(contentEmbeddings)
    .where(
      and(
        eq(contentEmbeddings.itemId, itemId),
        eq(contentEmbeddings.itemType, itemType)
      )
    );
}
