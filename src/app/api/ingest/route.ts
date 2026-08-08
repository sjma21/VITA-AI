import { NextResponse } from "next/server";
import { ingestAll } from "@/lib/ingest/all";
import { ingestGithub } from "@/lib/ingest/github";
import { ingestProfile, ingestResume } from "@/lib/ingest/resume";

function authorize(req: Request) {
  const secret = process.env.INGEST_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "INGEST_SECRET is not configured" },
      { status: 500 },
    );
  }
  const header = req.headers.get("x-ingest-secret");
  if (header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const denied = authorize(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target") ?? "all";

  try {
    if (target === "profile") {
      return NextResponse.json(await ingestProfile());
    }
    if (target === "resume") {
      return NextResponse.json(await ingestResume());
    }
    if (target === "github") {
      return NextResponse.json(await ingestGithub());
    }
    return NextResponse.json(await ingestAll());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
