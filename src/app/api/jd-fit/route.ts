import { loadProfile } from "@/lib/profile";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { buildJdFitSystemPrompt } from "@/lib/llm/jd-fit";
import { JD_MAX_CHARS } from "@/lib/limits";
import { assertAnyLlmConfigured } from "@/lib/llm/models";
import {
  createResilientTextStreamResponse,
  llmErrorResponse,
} from "@/lib/llm/resilient";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    assertAnyLlmConfigured();
  } catch (err) {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "No LLM configured (Claude and/or Gemini)",
      }),
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

  try {
    return createResilientTextStreamResponse(
      {
        system: buildJdFitSystemPrompt(profile, evidence),
        prompt: `Analyze how well ${profile.identity.name} fits this Job Description:\n\n---\n${jd}\n---`,
        temperature: 0.2,
      },
      {
        onFinish: async ({ provider, claudeAttempts, errors }) => {
          await prisma.event.create({
            data: {
              type: "llm_provider",
              payload: {
                feature: "jd_fit",
                provider,
                claudeAttempts,
                errors,
              },
            },
          });
        },
      },
    );
  } catch (err) {
    return llmErrorResponse(err);
  }
}
