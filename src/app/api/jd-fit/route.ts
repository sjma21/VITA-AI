import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { loadProfile } from "@/lib/profile";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { buildJdFitSystemPrompt } from "@/lib/llm/jd-fit";
import { JD_MAX_CHARS } from "@/lib/limits";
import { prisma } from "@/lib/db";
import { requireEnv } from "@/lib/env";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    requireEnv("ANTHROPIC_API_KEY");
  } catch {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = (await req.json()) as { prompt?: string; jd?: string };
  const jd = (body.prompt ?? body.jd ?? "").trim();

  if (!jd) {
    return new Response(JSON.stringify({ error: "Job description is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (jd.length > JD_MAX_CHARS) {
    return new Response(
      JSON.stringify({
        error: `JD too long (max ${JD_MAX_CHARS} characters)`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const profile = loadProfile();
  const evidence = await retrieveRelevantChunks(jd, { topK: 10, minScore: 0.15 });
  const modelId = process.env.CHAT_MODEL?.trim() || "claude-sonnet-4-5";

  await prisma.event.create({
    data: {
      type: "jd_fit",
      payload: {
        jdLength: jd.length,
        jdPreview: jd.slice(0, 280),
        citationCount: evidence.length,
      },
    },
  });

  const result = streamText({
    model: anthropic(modelId),
    system: buildJdFitSystemPrompt(profile, evidence),
    prompt: `Analyze how well ${profile.identity.name} fits this Job Description:\n\n---\n${jd}\n---`,
    temperature: 0.2,
  });

  return result.toTextStreamResponse();
}
