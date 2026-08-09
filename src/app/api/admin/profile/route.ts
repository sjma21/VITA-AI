import { NextResponse } from "next/server";
import { readProfileYaml, saveProfileYaml } from "@/lib/content-admin";
import { ingestProfile } from "@/lib/ingest/resume";

export const maxDuration = 120;

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      yaml: readProfileYaml(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read profile";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      yaml?: string;
      ingest?: boolean;
    };

    const yaml = body.yaml ?? "";
    if (!yaml.trim()) {
      return NextResponse.json({ ok: false, error: "YAML is empty" }, { status: 400 });
    }

    saveProfileYaml(yaml);

    let ingestResult: { deleted: number; inserted: number } | undefined;
    if (body.ingest) {
      ingestResult = await ingestProfile();
    }

    return NextResponse.json({
      ok: true,
      saved: true,
      ingested: Boolean(body.ingest),
      ingestResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
