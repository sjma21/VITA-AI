import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { contentPath } from "@/lib/env";
import { profileSchema } from "@/lib/profile";

const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

export function readProfileYaml(): string {
  return readFileSync(contentPath("profile.yaml"), "utf8");
}

export function saveProfileYaml(raw: string): { ok: true } {
  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    throw new Error(
      `Invalid YAML: ${err instanceof Error ? err.message : "parse failed"}`,
    );
  }

  const result = profileSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.join(".") || "profile";
    throw new Error(`Profile validation failed at ${path}: ${issue?.message}`);
  }

  // Keep the editor's YAML text (comments preserved) after schema validates.
  writeFileSync(
    contentPath("profile.yaml"),
    raw.endsWith("\n") ? raw : `${raw}\n`,
    "utf8",
  );
  return { ok: true };
}

export type PdfKind = "resume" | "cover-letter";

export function pdfFilename(kind: PdfKind): string {
  return kind === "resume" ? "resume.pdf" : "cover-letter.pdf";
}

export function contentFileMeta(kind: PdfKind): {
  exists: boolean;
  bytes?: number;
  path: string;
} {
  const name = pdfFilename(kind);
  const path = contentPath(name);
  if (!existsSync(path)) return { exists: false, path: name };
  const bytes = readFileSync(path).byteLength;
  return { exists: true, bytes, path: name };
}

export async function saveUploadedPdf(
  kind: PdfKind,
  file: File,
): Promise<{ bytes: number; filename: string }> {
  if (!file || file.size === 0) {
    throw new Error("No file uploaded");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`PDF too large (max ${MAX_PDF_BYTES / (1024 * 1024)} MB)`);
  }

  const type = (file.type || "").toLowerCase();
  if (type && type !== "application/pdf") {
    throw new Error("Only PDF files are allowed");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("File does not look like a valid PDF");
  }

  const filename = pdfFilename(kind);
  writeFileSync(contentPath(filename), buffer);
  return { bytes: buffer.byteLength, filename };
}
