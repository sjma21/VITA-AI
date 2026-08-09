import type { Profile } from "@/lib/profile";

export type ProofRepo = {
  name: string;
  url: string;
  summary?: string;
  tech: string[];
};

export type ProofPack = {
  candidateName: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl?: string;
  resumeUrl: string;
  resumeDownloadUrl: string;
  coverLetterUrl: string;
  coverLetterDownloadUrl: string;
  repos: ProofRepo[];
};

const TOP_REPO_LIMIT = 8;

function repoNameFromUrl(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[1] ?? null;
  } catch {
    return null;
  }
}

/** Build Proof pack data from the canonical profile (allowlist order + project blurbs). */
export function buildProofPack(profile: Profile): ProofPack {
  const username = profile.github.username;
  const byRepoName = new Map<
    string,
    { summary?: string; tech: string[]; url: string }
  >();

  for (const project of profile.projects) {
    const urls = [
      project.github,
      ...(project.related_repos ?? []),
    ].filter((u): u is string => Boolean(u));

    for (const url of urls) {
      const name = repoNameFromUrl(url);
      if (!name || byRepoName.has(name)) continue;
      byRepoName.set(name, {
        url,
        summary: project.summary,
        tech: project.tech ?? [],
      });
    }
  }

  const repos: ProofRepo[] = [];
  for (const name of profile.github.allowlist) {
    if (repos.length >= TOP_REPO_LIMIT) break;
    const meta = byRepoName.get(name);
    repos.push({
      name,
      url: meta?.url ?? `https://github.com/${username}/${name}`,
      summary: meta?.summary,
      tech: meta?.tech ?? [],
    });
  }

  const portfolio = profile.identity.links.portfolio?.trim();

  return {
    candidateName: profile.identity.name,
    linkedinUrl:
      profile.linkedin?.url || profile.identity.links.linkedin || "",
    githubUrl: profile.github.url || profile.identity.links.github || "",
    portfolioUrl: portfolio || undefined,
    resumeUrl: "/api/resume",
    resumeDownloadUrl: "/api/resume?download=1",
    coverLetterUrl: "/api/cover-letter",
    coverLetterDownloadUrl: "/api/cover-letter?download=1",
    repos,
  };
}
