import { NextResponse } from "next/server";
import { ingestAll } from "@/lib/ingest/all";
import { ingestGithub } from "@/lib/ingest/github";
import { ingestProfile, ingestResume } from "@/lib/ingest/resume";

export const maxDuration = 120;

const TARGETS = new Set(["all", "profile", "resume", "github"]);

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = (searchParams.get("target") ?? "all").toLowerCase();

  if (!TARGETS.has(target)) {
    return NextResponse.json(
      { error: `Invalid target. Use: ${[...TARGETS].join(", ")}` },
      { status: 400 },
    );
  }

  try {
    if (target === "profile") {
      return NextResponse.json({ ok: true, target, result: await ingestProfile() });
    }
    if (target === "resume") {
      return NextResponse.json({ ok: true, target, result: await ingestResume() });
    }
    if (target === "github") {
      return NextResponse.json({ ok: true, target, result: await ingestGithub() });
    }
    return NextResponse.json({ ok: true, target, result: await ingestAll() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
