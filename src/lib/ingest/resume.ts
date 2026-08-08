import { readFileSync, existsSync } from "node:fs";
import { PDFParse } from "pdf-parse";
import { contentPath } from "@/lib/env";
import { chunkText, type TextChunk } from "@/lib/rag/chunk";
import { replaceChunksForSource } from "@/lib/rag/store";
import { loadProfile, profileToTextBlocks } from "@/lib/profile";

export async function extractPdfText(filePath: string): Promise<string> {
  const data = new Uint8Array(readFileSync(filePath));
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.text?.trim() ?? "";
  } finally {
    await parser.destroy();
  }
}

export async function ingestProfile(): Promise<{
  deleted: number;
  inserted: number;
}> {
  const profile = loadProfile();
  const blocks = profileToTextBlocks(profile);
  const chunks: TextChunk[] = blocks.flatMap((block) =>
    chunkText(block.content, {
      sourceRefPrefix: block.sourceRef,
      metadata: { kind: "profile" },
    }),
  );

  return replaceChunksForSource({
    source: "profile",
    chunks,
    eventType: "ingest_profile",
  });
}

/** Ingest resume.pdf (+ optional cover-letter.pdf) into source=resume. */
export async function ingestResume(): Promise<{
  deleted: number;
  inserted: number;
  chars: number;
}> {
  const resumePath = contentPath("resume.pdf");
  if (!existsSync(resumePath)) {
    throw new Error(`Missing ${resumePath}`);
  }

  const chunks: TextChunk[] = [];
  let chars = 0;

  const resumeText = await extractPdfText(resumePath);
  if (!resumeText) {
    throw new Error(`No text extracted from ${resumePath}`);
  }
  chars += resumeText.length;
  chunks.push(
    ...chunkText(resumeText, {
      sourceRefPrefix: "resume",
      metadata: { file: "resume.pdf" },
    }),
  );

  const coverPath = contentPath("cover-letter.pdf");
  if (existsSync(coverPath)) {
    const coverText = await extractPdfText(coverPath);
    if (coverText) {
      chars += coverText.length;
      chunks.push(
        ...chunkText(coverText, {
          sourceRefPrefix: "cover-letter",
          metadata: { file: "cover-letter.pdf" },
        }),
      );
    }
  }

  const result = await replaceChunksForSource({
    source: "resume",
    chunks,
    eventType: "ingest_resume",
  });

  return { ...result, chars };
}
