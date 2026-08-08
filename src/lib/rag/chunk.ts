export type TextChunk = {
  sourceRef: string;
  content: string;
  metadata?: Record<string, unknown>;
};

const DEFAULT_MAX_CHARS = 1800;
const DEFAULT_OVERLAP = 200;

/**
 * Split long text into overlapping chunks. Prefer paragraph boundaries.
 */
export function chunkText(
  text: string,
  options?: {
    sourceRefPrefix?: string;
    maxChars?: number;
    overlap?: number;
    metadata?: Record<string, unknown>;
  },
): TextChunk[] {
  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;
  const overlap = options?.overlap ?? DEFAULT_OVERLAP;
  const prefix = options?.sourceRefPrefix ?? "chunk";
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  if (cleaned.length <= maxChars) {
    return [
      {
        sourceRef: `${prefix}:0`,
        content: cleaned,
        metadata: options?.metadata,
      },
    ];
  }

  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let buffer = "";
  let index = 0;

  const flush = (force = false) => {
    if (!buffer.trim()) return;
    if (buffer.length < maxChars && !force) return;
    while (buffer.length > maxChars) {
      const slice = buffer.slice(0, maxChars);
      const lastBreak = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(". "));
      const cut = lastBreak > maxChars * 0.5 ? lastBreak + 1 : maxChars;
      chunks.push({
        sourceRef: `${prefix}:${index++}`,
        content: buffer.slice(0, cut).trim(),
        metadata: options?.metadata,
      });
      buffer = buffer.slice(Math.max(0, cut - overlap)).trimStart();
    }
    if (force && buffer.trim()) {
      chunks.push({
        sourceRef: `${prefix}:${index++}`,
        content: buffer.trim(),
        metadata: options?.metadata,
      });
      buffer = "";
    }
  };

  for (const para of paragraphs) {
    if ((buffer + "\n\n" + para).length > maxChars && buffer) {
      flush(true);
    }
    buffer = buffer ? `${buffer}\n\n${para}` : para;
    flush(false);
  }
  flush(true);

  return chunks;
}
