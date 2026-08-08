import { prisma } from "@/lib/db";
import { embedQuery } from "@/lib/rag/embed";

export type RetrievedChunk = {
  id: string;
  source: string;
  sourceRef: string | null;
  content: string;
  score: number;
};

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Cosine-distance retrieval over pgvector chunks.
 * Lower distance = closer; we expose score as 1 - distance.
 */
export async function retrieveRelevantChunks(
  query: string,
  options?: { topK?: number; minScore?: number },
): Promise<RetrievedChunk[]> {
  const topK = options?.topK ?? 8;
  const minScore = options?.minScore ?? 0.2;
  const embedding = await embedQuery(query);
  const vector = toVectorLiteral(embedding);

  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      source: string;
      sourceRef: string | null;
      content: string;
      distance: number;
    }[]
  >(
    `SELECT id, source::text AS source, "sourceRef", content,
            (embedding <=> $1::vector) AS distance
     FROM chunks
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vector,
    topK,
  );

  return rows
    .map((row) => ({
      id: row.id,
      source: row.source,
      sourceRef: row.sourceRef,
      content: row.content,
      score: 1 - Number(row.distance),
    }))
    .filter((row) => row.score >= minScore);
}

export function formatEvidence(chunks: RetrievedChunk[]): string {
  if (!chunks.length) {
    return "(No retrieved evidence — answer only from the canonical profile digest below, or say you do not know.)";
  }

  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] source=${c.source} ref=${c.sourceRef ?? "n/a"} score=${c.score.toFixed(3)}\n${c.content}`,
    )
    .join("\n\n---\n\n");
}
