import type { Profile } from "@/lib/profile";
import type { RetrievedChunk } from "@/lib/rag/retrieve";
import { formatEvidence } from "@/lib/rag/retrieve";

export function buildProfileDigest(profile: Profile): string {
  const skills = [
    ...profile.skills.primary.map((s) => s.name),
    ...profile.skills.secondary.map((s) => s.name),
  ].join(", ");

  const experience = profile.experience
    .map(
      (job) =>
        `- ${job.role} at ${job.company} (${job.start} – ${job.end})\n  ${job.highlights.slice(0, 3).join("; ")}`,
    )
    .join("\n");

  const education = profile.education
    .map(
      (edu) =>
        `- ${edu.degree} — ${edu.institution} (${edu.start ?? "?"} – ${edu.end ?? "?"})${edu.score ? ` | ${edu.score}` : ""}${edu.status ? ` | ${edu.status}` : ""}`,
    )
    .join("\n");

  const projects = profile.projects
    .slice(0, 8)
    .map(
      (p) =>
        `- ${p.name}${p.github ? ` (${p.github})` : ""}: ${p.summary ?? ""}`,
    )
    .join("\n");

  return [
    `Candidate: ${profile.identity.name}`,
    `Title: ${profile.identity.title}`,
    `Location: ${profile.identity.location}`,
    `Email: ${profile.identity.email}`,
    `Links: LinkedIn ${profile.identity.links.linkedin} | GitHub ${profile.identity.links.github} | Portfolio ${profile.identity.links.portfolio}`,
    "",
    `Pitch: ${profile.pitch}`,
    "",
    "Experience:",
    experience,
    "",
    "Education:",
    education,
    "",
    `Skills: ${skills}`,
    profile.skills.tech_stack_blurb
      ? `Stack blurb: ${profile.skills.tech_stack_blurb}`
      : "",
    "",
    "Notable projects:",
    projects,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSystemPrompt(
  profile: Profile,
  evidence: RetrievedChunk[],
): string {
  const voice =
    profile.guardrails?.voice === "first_person" ? "first person" : "third person";
  const decline = (profile.guardrails?.decline_topics ?? []).join(", ");
  const unknown =
    profile.guardrails?.unknown_policy?.trim() ||
    "If unsure, say you do not know and point to LinkedIn, GitHub, portfolio, or email.";

  return `You are Vita, an AI assistant that answers recruiter questions about ${profile.identity.name}.

## Role
- Speak in ${voice} about the candidate (default: "${profile.identity.name} is…").
- Be concise, professional, and recruiter-friendly (bullets and concrete tech/metrics when available).
- Format answers in clean Markdown: short headings, bold labels, bullet lists. Avoid raw ** markers without structure.
- Answer ONLY from the Canonical Profile Digest and Retrieved Evidence below.
- Never invent employers, dates, degrees, salary figures, or metrics.
- Decline or redirect: ${decline || "personal life, politics"}.
- Salary: do not invent numbers; redirect to email ${profile.identity.email}.
- ${unknown}

## Citations
When you use retrieved evidence, mention sources briefly inline like (resume), (profile), or (github:RepoName).

## Canonical Profile Digest
${buildProfileDigest(profile)}

## Retrieved Evidence
${formatEvidence(evidence)}
`;
}

export function lastUserText(
  messages: { role: string; parts?: { type: string; text?: string }[]; content?: string }[],
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== "user") continue;
    if (typeof m.content === "string" && m.content.trim()) return m.content.trim();
    if (Array.isArray(m.parts)) {
      const text = m.parts
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("\n")
        .trim();
      if (text) return text;
    }
  }
  return "";
}
