"use client";

import type { ProofPack } from "@/lib/proof-pack";

export function ProofPackPanel({ pack }: { pack: ProofPack }) {
  return (
    <section
      aria-label="Proof pack"
      className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/90 bg-card/90"
    >
      <div className="border-b border-border/80 px-4 py-3.5 sm:px-5">
        <p className="text-sm font-semibold tracking-tight">Proof pack</p>
        <p className="text-xs text-muted-foreground">
          Documents and links that back up what Vita says about{" "}
          {pack.candidateName}.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-4 py-5 sm:px-5">
        <section aria-labelledby="proof-docs">
          <h2
            id="proof-docs"
            className="mb-3 font-heading text-base text-foreground"
          >
            Documents
          </h2>
          <ul className="divide-y divide-border/70 border-y border-border/70">
            <DocRow
              title="Resume"
              hint="PDF — open or download"
              openHref={pack.resumeUrl}
              downloadHref={pack.resumeDownloadUrl}
            />
            <DocRow
              title="Cover letter"
              hint="PDF — open or download"
              openHref={pack.coverLetterUrl}
              downloadHref={pack.coverLetterDownloadUrl}
            />
          </ul>
        </section>

        <section aria-labelledby="proof-profiles">
          <h2
            id="proof-profiles"
            className="mb-3 font-heading text-base text-foreground"
          >
            Profiles
          </h2>
          <ul className="divide-y divide-border/70 border-y border-border/70">
            {pack.linkedinUrl ? (
              <LinkRow
                title="LinkedIn"
                hint="Verify experience and activity"
                href={pack.linkedinUrl}
              />
            ) : null}
            {pack.githubUrl ? (
              <LinkRow
                title="GitHub"
                hint={`@${pack.githubUrl.replace(/\/$/, "").split("/").pop() ?? "profile"}`}
                href={pack.githubUrl}
              />
            ) : null}
            {pack.portfolioUrl ? (
              <LinkRow
                title="Portfolio"
                hint="Personal site"
                href={pack.portfolioUrl}
              />
            ) : null}
          </ul>
        </section>

        <section aria-labelledby="proof-repos">
          <h2
            id="proof-repos"
            className="mb-1 font-heading text-base text-foreground"
          >
            Featured repos
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Curated from the GitHub allowlist — open a repo for code and README
            evidence.
          </p>
          <ul className="divide-y divide-border/70 border-y border-border/70">
            {pack.repos.map((repo) => (
              <li key={repo.name} className="py-3.5 first:pt-3 last:pb-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-vita-teal underline-offset-4 transition hover:underline"
                  >
                    {repo.name}
                  </a>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Open on GitHub
                  </a>
                </div>
                {repo.summary ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {repo.summary}
                  </p>
                ) : null}
                {repo.tech.length > 0 ? (
                  <p className="mt-1.5 text-xs text-muted-foreground/90">
                    {repo.tech.slice(0, 6).join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function DocRow({
  title,
  hint,
  openHref,
  downloadHref,
}: {
  title: string;
  hint: string;
  openHref: string;
  downloadHref: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-3 last:pb-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-vita-teal underline-offset-4 transition hover:underline"
        >
          Open
        </a>
        <a
          href={downloadHref}
          className="text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
        >
          Download
        </a>
      </div>
    </li>
  );
}

function LinkRow({
  title,
  hint,
  href,
}: {
  title: string;
  hint: string;
  href: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-3 last:pb-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-vita-teal underline-offset-4 transition hover:underline"
      >
        Visit
      </a>
    </li>
  );
}
