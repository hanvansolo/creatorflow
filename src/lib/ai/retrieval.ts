import { db } from "@/lib/db";
import { contentEmbeddings, ideas, notes, scripts } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getOpenAI } from "./provider";

export type RetrievedChunk = {
  itemId: string;
  itemType: string;
  chunkText: string;
  title: string;
  similarity: number;
};

/**
 * Search for the most relevant content chunks for a query.
 */
export async function retrieveContext(
  userId: string,
  query: string,
  topK: number = 10
): Promise<RetrievedChunk[]> {
  const openai = getOpenAI();

  // Embed the query
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryEmbedding = response.data[0].embedding;

  // Vector similarity search using pgvector
  const results = await db.execute(sql`
    SELECT
      ce.item_id,
      ce.item_type,
      ce.chunk_text,
      1 - (ce.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM content_embeddings ce
    WHERE ce.user_id = ${userId}
      AND ce.embedding IS NOT NULL
    ORDER BY ce.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${topK}
  `);

  // Fetch titles for each unique item
  const chunks = results as unknown as Array<{
    item_id: string;
    item_type: string;
    chunk_text: string;
    similarity: number;
  }>;

  // Get titles in parallel
  const titlesMap = new Map<string, string>();
  const uniqueItems = [...new Set(chunks.map((c) => `${c.item_type}:${c.item_id}`))];

  await Promise.all(
    uniqueItems.map(async (key) => {
      const [type, id] = key.split(":");
      let title = "Untitled";

      if (type === "idea") {
        const item = await db.query.ideas.findFirst({
          where: eq(ideas.id, id),
          columns: { title: true },
        });
        if (item) title = item.title;
      } else if (type === "note") {
        const item = await db.query.notes.findFirst({
          where: eq(notes.id, id),
          columns: { title: true },
        });
        if (item) title = item.title;
      } else if (type === "script") {
        const item = await db.query.scripts.findFirst({
          where: eq(scripts.id, id),
          columns: { title: true },
        });
        if (item) title = item.title;
      }

      titlesMap.set(key, title);
    })
  );

  return chunks.map((c) => ({
    itemId: c.item_id,
    itemType: c.item_type,
    chunkText: c.chunk_text,
    title: titlesMap.get(`${c.item_type}:${c.item_id}`) || "Untitled",
    similarity: Number(c.similarity),
  }));
}
