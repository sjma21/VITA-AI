import { loadProfile } from "@/lib/profile";
import { chunkText, type TextChunk } from "@/lib/rag/chunk";
import { replaceChunksForSource } from "@/lib/rag/store";
import { requireEnv } from "@/lib/env";

type GhRepo = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
  pushed_at: string;
  default_branch: string;
};

async function ghFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "vita-ingest",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function fetchReadme(
  owner: string,
  repo: string,
  token: string,
): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      headers: {
        Accept: "application/vnd.github.raw+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "vita-ingest",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub readme ${owner}/${repo} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.text()).trim();
}

export async function ingestGithub(): Promise<{
  deleted: number;
  inserted: number;
  repos: string[];
}> {
  const token = requireEnv("GITHUB_TOKEN");
  const profile = loadProfile();
  const username =
    process.env.GITHUB_USERNAME?.trim() || profile.github.username;
  const allowlist = profile.github.allowlist;

  if (!allowlist.length) {
    throw new Error("profile.github.allowlist is empty — add repo names to ingest");
  }

  const chunks: TextChunk[] = [];
  const ingested: string[] = [];

  for (const repoName of allowlist) {
    const repo = await ghFetch<GhRepo>(
      `/repos/${username}/${repoName}`,
      token,
    );
    const readme = await fetchReadme(username, repoName, token);
    const languages = await ghFetch<Record<string, number>>(
      `/repos/${username}/${repoName}/languages`,
      token,
    );

    const header = [
      `Repository: ${repo.full_name}`,
      `URL: ${repo.html_url}`,
      `Description: ${repo.description ?? "(none)"}`,
      `Primary language: ${repo.language ?? "n/a"}`,
      `Languages: ${Object.keys(languages).join(", ") || "n/a"}`,
      `Stars: ${repo.stargazers_count}`,
      `Topics: ${(repo.topics ?? []).join(", ") || "n/a"}`,
      `Last push: ${repo.pushed_at}`,
    ].join("\n");

    chunks.push({
      sourceRef: `github:${repoName}:meta`,
      content: header,
      metadata: {
        repo: repoName,
        url: repo.html_url,
        kind: "meta",
      },
    });

    if (readme) {
      chunks.push(
        ...chunkText(readme, {
          sourceRefPrefix: `github:${repoName}:readme`,
          metadata: { repo: repoName, url: repo.html_url, kind: "readme" },
          maxChars: 2000,
        }),
      );
    }

    ingested.push(repoName);
  }

  const result = await replaceChunksForSource({
    source: "github",
    chunks,
    eventType: "ingest_github",
  });

  return { ...result, repos: ingested };
}
