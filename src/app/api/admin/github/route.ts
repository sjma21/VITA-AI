import { NextResponse } from "next/server";
import { parseDocument } from "yaml";
import { readFileSync, writeFileSync } from "node:fs";
import { contentPath } from "@/lib/env";
import { profileSchema } from "@/lib/profile";
import { ingestGithub } from "@/lib/ingest/github";

export const maxDuration = 120;

/** Update GitHub allowlist in profile.yaml (preserves comments via YAML Document). */
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      allowlist?: string[];
      ingest?: boolean;
    };

    const allowlist = (body.allowlist ?? [])
      .map((r) => r.trim())
      .filter(Boolean);

    if (allowlist.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Allowlist cannot be empty" },
        { status: 400 },
      );
    }

    const raw = readFileSync(contentPath("profile.yaml"), "utf8");
    const doc = parseDocument(raw);
    doc.setIn(["github", "allowlist"], allowlist);

    const nextRaw = String(doc);
    const result = profileSchema.safeParse(doc.toJSON());
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue?.path?.join(".") || "profile";
      return NextResponse.json(
        {
          ok: false,
          error: `Profile validation failed at ${path}: ${issue?.message}`,
        },
        { status: 400 },
      );
    }

    writeFileSync(
      contentPath("profile.yaml"),
      nextRaw.endsWith("\n") ? nextRaw : `${nextRaw}\n`,
      "utf8",
    );

    let ingestResult: unknown;
    if (body.ingest) {
      ingestResult = await ingestGithub();
    }

    return NextResponse.json({
      ok: true,
      allowlist,
      ingested: Boolean(body.ingest),
      ingestResult,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update GitHub allowlist";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
