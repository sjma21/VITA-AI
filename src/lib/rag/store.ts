import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import type { ChunkSource, Prisma } from "@prisma/client";
import type { TextChunk } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function replaceChunksForSource(params: {
  source: ChunkSource;
  chunks: TextChunk[];
  eventType: string;
}): Promise<{ deleted: number; inserted: number }> {
  const { source, chunks, eventType } = params;

  const deleted = await prisma.chunk.deleteMany({ where: { source } });

  if (chunks.length === 0) {
    await prisma.event.create({
      data: {
        type: eventType,
        payload: { source, deleted: deleted.count, inserted: 0 },
      },
    });
    return { deleted: deleted.count, inserted: 0 };
  }

  const embeddings = await embedTexts(chunks.map((c) => c.content));

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const embedding = embeddings[i]!;
    const id = createId();
    const metadata = (chunk.metadata ?? {}) as Prisma.InputJsonValue;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "chunks" ("id", "source", "sourceRef", "content", "embedding", "metadata", "createdAt", "updatedAt")
       VALUES ($1, $2::"ChunkSource", $3, $4, $5::vector, $6::jsonb, NOW(), NOW())`,
      id,
      source,
      chunk.sourceRef,
      chunk.content,
      toVectorLiteral(embedding),
      JSON.stringify(metadata),
    );
  }

  await prisma.event.create({
    data: {
      type: eventType,
      payload: { source, deleted: deleted.count, inserted: chunks.length },
    },
  });

  return { deleted: deleted.count, inserted: chunks.length };
}
