import { NextResponse } from "next/server";
import { saveUploadedPdf, type PdfKind } from "@/lib/content-admin";
import { ingestResume } from "@/lib/ingest/resume";

export const maxDuration = 120;

const KINDS = new Set<PdfKind>(["resume", "cover-letter"]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const kindRaw = String(form.get("kind") ?? "");
    const ingest = String(form.get("ingest") ?? "") === "1";
    const file = form.get("file");

    if (!KINDS.has(kindRaw as PdfKind)) {
      return NextResponse.json(
        { ok: false, error: "kind must be resume or cover-letter" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "file is required" },
        { status: 400 },
      );
    }

    const saved = await saveUploadedPdf(kindRaw as PdfKind, file);

    let ingestResult:
      | { deleted: number; inserted: number; chars: number }
      | undefined;
    if (ingest) {
      ingestResult = await ingestResume();
    }

    return NextResponse.json({
      ok: true,
      saved,
      ingested: ingest,
      ingestResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
