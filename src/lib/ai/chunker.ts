/**
 * Split text into overlapping chunks for embedding.
 * Target: ~500 tokens per chunk with 50 token overlap.
 * Rough estimate: 1 token ≈ 4 chars.
 */

const CHUNK_SIZE = 2000; // ~500 tokens in chars
const CHUNK_OVERLAP = 200; // ~50 tokens overlap

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= CHUNK_SIZE) {
    return cleaned.length > 0 ? [cleaned] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + CHUNK_SIZE;

    // Try to break at a sentence or paragraph boundary
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end + 100);
      const sentenceEnd = slice.lastIndexOf(". ");
      const newline = slice.lastIndexOf("\n");
      const breakPoint = Math.max(sentenceEnd, newline);

      if (breakPoint > CHUNK_SIZE * 0.5) {
        end = start + breakPoint + 1;
      }
    } else {
      end = cleaned.length;
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end - CHUNK_OVERLAP;
    if (start >= cleaned.length) break;
  }

  return chunks;
}
