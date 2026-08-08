import path from "node:path";

export function contentPath(...segments: string[]) {
  return path.join(process.cwd(), "content", ...segments);
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEmbeddingConfig() {
  const apiKey = requireEnv("OPENROUTER_API_KEY");
  const model =
    process.env.EMBEDDING_MODEL?.trim() || "nvidia/nemotron-3-embed-1b:free";
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || "2048");
  return { apiKey, model, dimensions };
}
