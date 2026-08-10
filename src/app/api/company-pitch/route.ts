import { loadProfile } from "@/lib/profile";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { buildCompanyPitchSystemPrompt } from "@/lib/llm/company-pitch";
import {
  PITCH_COMPANY_MAX,
  PITCH_NOTES_MAX,
  PITCH_ROLE_MAX,
} from "@/lib/limits";
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

  const body = (await req.json()) as {
    prompt?: string;
    company?: string;
    role?: string;
    notes?: string;
  };

  const company = (body.company ?? "").trim();
  const role = (body.role ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!company || !role) {
    return new Response(
      JSON.stringify({ error: "Company and role are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (company.length > PITCH_COMPANY_MAX) {
    return new Response(
      JSON.stringify({
        error: `Company too long (max ${PITCH_COMPANY_MAX} characters)`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (role.length > PITCH_ROLE_MAX) {
    return new Response(
      JSON.stringify({
        error: `Role too long (max ${PITCH_ROLE_MAX} characters)`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (notes.length > PITCH_NOTES_MAX) {
    return new Response(
      JSON.stringify({
        error: `Notes too long (max ${PITCH_NOTES_MAX} characters)`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const query = [company, role, notes].filter(Boolean).join("\n");
  const profile = loadProfile();
  const evidence = await retrieveRelevantChunks(query, {
    topK: 10,
    minScore: 0.15,
  });

  await prisma.event.create({
    data: {
      type: "company_pitch",
      payload: {
        company,
        role,
        notesLength: notes.length,
        citationCount: evidence.length,
      },
    },
  });

  const userPrompt = [
    `Write a company-tailored pitch for ${profile.identity.name}.`,
    ``,
    `Company: ${company}`,
    `Role: ${role}`,
    notes ? `Notes from recruiter:\n${notes}` : "Notes from recruiter: (none)",
  ].join("\n");

  try {
    return createResilientTextStreamResponse(
      {
        system: buildCompanyPitchSystemPrompt(profile, evidence),
        prompt: userPrompt,
        temperature: 0.35,
      },
      {
        onFinish: async ({ provider, claudeAttempts, errors }) => {
          await prisma.event.create({
            data: {
              type: "llm_provider",
              payload: {
                feature: "company_pitch",
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
