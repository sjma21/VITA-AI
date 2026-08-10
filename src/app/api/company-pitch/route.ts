import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { loadProfile } from "@/lib/profile";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { buildCompanyPitchSystemPrompt } from "@/lib/llm/company-pitch";
import {
  PITCH_COMPANY_MAX,
  PITCH_NOTES_MAX,
  PITCH_ROLE_MAX,
} from "@/lib/limits";
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
  const modelId = process.env.CHAT_MODEL?.trim() || "claude-sonnet-4-5";

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

  const result = streamText({
    model: anthropic(modelId),
    system: buildCompanyPitchSystemPrompt(profile, evidence),
    prompt: userPrompt,
    temperature: 0.35,
  });

  return result.toTextStreamResponse();
}
