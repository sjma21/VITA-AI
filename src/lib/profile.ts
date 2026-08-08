import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { contentPath } from "@/lib/env";

const skillSchema = z.object({
  name: z.string(),
  level: z.string().optional(),
  used_in_production: z.boolean().optional(),
});

const experienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  employment_type: z.string().optional(),
  start: z.string(),
  end: z.string(),
  location: z.string().nullable().optional(),
  approx_years: z.number().optional(),
  summary: z.string().optional(),
  tech: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
});

const projectSchema = z.object({
  name: z.string(),
  period: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  related_repos: z.array(z.string()).optional(),
  summary: z.string().optional(),
  tech: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
});

export const profileSchema = z.object({
  identity: z.object({
    name: z.string(),
    title: z.string(),
    headline: z.string().optional(),
    location: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    links: z.object({
      portfolio: z.string().optional().default(""),
      linkedin: z.string().optional().default(""),
      github: z.string().optional().default(""),
      twitter: z.string().optional(),
      medium: z.string().optional(),
    }),
  }),
  pitch: z.string(),
  summary_for_recruiters: z.string().optional(),
  availability: z
    .object({
      seeking: z.array(z.string()).default([]),
      open_to: z.string().optional(),
      based_in: z.string().optional(),
      currently_learning: z.array(z.string()).default([]),
    })
    .optional(),
  experience: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.object({
    primary: z.array(skillSchema).default([]),
    secondary: z.array(skillSchema).default([]),
    tools: z.array(z.string()).default([]),
    core_subjects: z.array(z.string()).default([]),
    tech_stack_blurb: z.string().optional(),
  }),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        score: z.string().optional(),
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        status: z.string().optional(),
        highlights: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        year: z.string().optional(),
        issuer: z.string().optional(),
      }),
    )
    .default([]),
  linkedin: z
    .object({
      url: z.string(),
      note: z.string().optional(),
    })
    .optional(),
  github: z.object({
    url: z.string(),
    username: z.string(),
    public_repos_approx: z.number().optional(),
    allowlist: z.array(z.string()).default([]),
  }),
  faq_seeds: z
    .array(
      z.object({
        q: z.string(),
        a: z.string(),
      }),
    )
    .default([]),
  guardrails: z
    .object({
      voice: z.string().optional(),
      decline_topics: z.array(z.string()).default([]),
      salary_expectations: z.string().optional(),
      unknown_policy: z.string().optional(),
      source_priority: z.array(z.string()).default([]),
    })
    .optional(),
});

export type Profile = z.infer<typeof profileSchema>;

export function loadProfile(filePath = contentPath("profile.yaml")): Profile {
  const raw = readFileSync(filePath, "utf8");
  const parsed = parseYaml(raw);
  return profileSchema.parse(parsed);
}

/** Flatten profile into text blocks useful for RAG / system context. */
export function profileToTextBlocks(profile: Profile): { sourceRef: string; content: string }[] {
  const blocks: { sourceRef: string; content: string }[] = [];

  blocks.push({
    sourceRef: "profile:identity",
    content: [
      `Name: ${profile.identity.name}`,
      `Title: ${profile.identity.title}`,
      profile.identity.headline ? `Headline: ${profile.identity.headline}` : "",
      `Location: ${profile.identity.location}`,
      `Email: ${profile.identity.email}`,
      profile.identity.phone ? `Phone: ${profile.identity.phone}` : "",
      `Portfolio: ${profile.identity.links.portfolio}`,
      `LinkedIn: ${profile.identity.links.linkedin}`,
      `GitHub: ${profile.identity.links.github}`,
      "",
      `Pitch: ${profile.pitch}`,
      profile.summary_for_recruiters
        ? `Recruiter summary: ${profile.summary_for_recruiters}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  for (const [i, job] of profile.experience.entries()) {
    blocks.push({
      sourceRef: `profile:experience:${i}:${job.company}`,
      content: [
        `Company: ${job.company}`,
        `Role: ${job.role}`,
        `Dates: ${job.start} – ${job.end}`,
        job.summary ? `Summary: ${job.summary}` : "",
        job.tech.length ? `Tech: ${job.tech.join(", ")}` : "",
        "Highlights:",
        ...job.highlights.map((h) => `- ${h}`),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  for (const [i, project] of profile.projects.entries()) {
    blocks.push({
      sourceRef: `profile:project:${i}:${project.name}`,
      content: [
        `Project: ${project.name}`,
        project.period ? `Period: ${project.period}` : "",
        project.github ? `GitHub: ${project.github}` : "",
        project.summary ? `Summary: ${project.summary}` : "",
        project.tech.length ? `Tech: ${project.tech.join(", ")}` : "",
        ...(project.highlights?.length
          ? ["Highlights:", ...project.highlights.map((h) => `- ${h}`)]
          : []),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  blocks.push({
    sourceRef: "profile:skills",
    content: [
      "Primary skills:",
      ...profile.skills.primary.map(
        (s) =>
          `- ${s.name}${s.level ? ` (${s.level})` : ""}${s.used_in_production ? " [production]" : ""}`,
      ),
      "Secondary skills:",
      ...profile.skills.secondary.map(
        (s) =>
          `- ${s.name}${s.level ? ` (${s.level})` : ""}${s.used_in_production ? " [production]" : ""}`,
      ),
      `Tools: ${profile.skills.tools.join(", ")}`,
      `Core subjects: ${profile.skills.core_subjects.join(", ")}`,
      profile.skills.tech_stack_blurb
        ? `Stack blurb: ${profile.skills.tech_stack_blurb}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  for (const [i, edu] of profile.education.entries()) {
    blocks.push({
      sourceRef: `profile:education:${i}`,
      content: [
        `Institution: ${edu.institution}`,
        `Degree: ${edu.degree}`,
        edu.score ? `Score: ${edu.score}` : "",
        `Dates: ${edu.start ?? "?"} – ${edu.end ?? "?"}`,
        edu.status ? `Status: ${edu.status}` : "",
        ...(edu.highlights?.length
          ? ["Highlights:", ...edu.highlights.map((h) => `- ${h}`)]
          : []),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  if (profile.certifications.length) {
    blocks.push({
      sourceRef: "profile:certifications",
      content: profile.certifications
        .map(
          (c) =>
            `- ${c.name}${c.issuer ? ` (${c.issuer})` : ""}${c.year ? ` — ${c.year}` : ""}`,
        )
        .join("\n"),
    });
  }

  for (const [i, faq] of profile.faq_seeds.entries()) {
    blocks.push({
      sourceRef: `profile:faq:${i}`,
      content: `Q: ${faq.q}\nA: ${faq.a}`,
    });
  }

  return blocks;
}
