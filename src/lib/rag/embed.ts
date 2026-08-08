import OpenAI from "openai";
import { getEmbeddingConfig } from "@/lib/env";

let client: OpenAI | null = null;

function getClient() {
  if (client) return client;
  const { apiKey } = getEmbeddingConfig();
  client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Vita",
    },
  });
  return client;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { model, dimensions } = getEmbeddingConfig();
  const openai = getClient();

  const vectors: number[][] = [];
  const batchSize = 16;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model,
      input: batch,
      dimensions,
    });

    const sorted = [...response.data].sort((a, b) => a.index - b.index);
    for (const item of sorted) {
      if (item.embedding.length !== dimensions) {
        throw new Error(
          `Embedding dim mismatch: got ${item.embedding.length}, expected ${dimensions}`,
        );
      }
      vectors.push(item.embedding);
    }
  }

  return vectors;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
