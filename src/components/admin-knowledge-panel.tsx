"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Busy =
  | null
  | "profile-save"
  | "profile-ingest"
  | "resume"
  | "cover"
  | "github-save"
  | "github-ingest"
  | "all";

function formatBytes(bytes?: number) {
  if (bytes == null) return "missing";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminKnowledgePanel({
  initialYaml,
  githubAllowlist,
  resumeMeta,
  coverMeta,
  chunkCounts,
  recentIngests,
}: {
  initialYaml: string;
  githubAllowlist: string[];
  resumeMeta: { exists: boolean; bytes?: number };
  coverMeta: { exists: boolean; bytes?: number };
  chunkCounts: { source: string; count: number }[];
  recentIngests: {
    id: string;
    type: string;
    createdAt: string;
    summary: string;
  }[];
}) {
  const router = useRouter();
  const [yaml, setYaml] = useState(initialYaml);
  const [allowlistText, setAllowlistText] = useState(
    githubAllowlist.join("\n"),
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setYaml(initialYaml);
  }, [initialYaml]);

  useEffect(() => {
    setAllowlistText(githubAllowlist.join("\n"));
  }, [githubAllowlist]);

  function clearStatus() {
    setError(null);
    setSuccess(null);
  }

  async function saveProfile(ingest: boolean) {
    clearStatus();
    setBusy(ingest ? "profile-ingest" : "profile-save");
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml, ingest }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Save failed");
      setSuccess(
        ingest
          ? "Profile saved and re-ingested into Vita."
          : "Profile saved to content/profile.yaml.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function uploadPdf(
    kind: "resume" | "cover-letter",
    file: File | null,
    busyKey: "resume" | "cover",
  ) {
    clearStatus();
    if (!file) {
      setError(`Choose a ${kind} PDF first`);
      return;
    }
    setBusy(busyKey);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("ingest", "1");
      form.set("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed");
      setSuccess(
        `${kind === "resume" ? "Resume" : "Cover letter"} uploaded and re-ingested.`,
      );
      if (kind === "resume") setResumeFile(null);
      else setCoverFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveGithub(ingest: boolean) {
    clearStatus();
    setBusy(ingest ? "github-ingest" : "github-save");
    try {
      const allowlist = allowlistText
        .split(/[\n,]+/)
        .map((r) => r.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/github", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowlist, ingest }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "GitHub update failed");
      setSuccess(
        ingest
          ? "GitHub allowlist saved and repos re-ingested."
          : "GitHub allowlist saved to profile.yaml.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub update failed");
    } finally {
      setBusy(null);
    }
  }

  async function ingestAll() {
    clearStatus();
    setBusy("all");
    try {
      const res = await fetch("/api/admin/ingest?target=all", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Ingest failed");
      }
      setSuccess("All sources re-ingested successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed");
    } finally {
      setBusy(null);
    }
  }

  const locked = busy !== null;

  return (
    <section aria-labelledby="admin-knowledge" className="flex flex-col gap-8">
      <div>
        <h2
          id="admin-knowledge"
          className="font-heading text-lg text-foreground"
        >
          Update knowledge
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          1) Edit profile → 2) Upload resume / cover letter PDFs → 3) Sync
          GitHub. Each step can save and re-embed into Vita.
        </p>
        {chunkCounts.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Chunks in DB:{" "}
            {chunkCounts.map((c) => `${c.source} ${c.count}`).join(" · ")}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No chunks yet — save &amp; ingest to seed Vita.
          </p>
        )}
      </div>

      {/* 1. Profile */}
      <div className="flex flex-col gap-3 border-t border-border/70 pt-6">
        <div>
          <p className="text-sm font-semibold text-foreground">
            1. Profile update
          </p>
          <p className="text-xs text-muted-foreground">
            Edit <code className="font-mono">content/profile.yaml</code>{" "}
            (validated before save). Comments are kept.
          </p>
        </div>
        <textarea
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          disabled={locked}
          spellCheck={false}
          rows={16}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={locked}
            onClick={() => saveProfile(false)}
          >
            {busy === "profile-save" ? "Saving…" : "Save profile"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={locked}
            onClick={() => saveProfile(true)}
          >
            {busy === "profile-ingest" ? "Saving & ingesting…" : "Save & re-ingest"}
          </Button>
        </div>
      </div>

      {/* 2. PDFs */}
      <div className="flex flex-col gap-4 border-t border-border/70 pt-6">
        <div>
          <p className="text-sm font-semibold text-foreground">
            2. Resume &amp; cover letter PDFs
          </p>
          <p className="text-xs text-muted-foreground">
            Upload a new PDF — it replaces the file under{" "}
            <code className="font-mono">content/</code> and re-ingests
            automatically.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium">Resume PDF</span>
            <span className="text-xs text-muted-foreground">
              Current: {resumeMeta.exists ? formatBytes(resumeMeta.bytes) : "none"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={locked}
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={locked || !resumeFile}
            onClick={() => uploadPdf("resume", resumeFile, "resume")}
          >
            {busy === "resume" ? "Uploading…" : "Upload & ingest"}
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium">Cover letter PDF</span>
            <span className="text-xs text-muted-foreground">
              Current: {coverMeta.exists ? formatBytes(coverMeta.bytes) : "none"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={locked}
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={locked || !coverFile}
            onClick={() => uploadPdf("cover-letter", coverFile, "cover")}
          >
            {busy === "cover" ? "Uploading…" : "Upload & ingest"}
          </Button>
        </div>
      </div>

      {/* 3. GitHub */}
      <div className="flex flex-col gap-3 border-t border-border/70 pt-6">
        <div>
          <p className="text-sm font-semibold text-foreground">3. GitHub</p>
          <p className="text-xs text-muted-foreground">
            One repo name per line (allowlist). Sync pulls READMEs and metadata
            into Vita.
          </p>
        </div>
        <textarea
          value={allowlistText}
          onChange={(e) => setAllowlistText(e.target.value)}
          disabled={locked}
          spellCheck={false}
          rows={8}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
          placeholder={"Hire-Prep-AI\nVeritas-AI\nVITA-AI"}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={locked}
            onClick={() => saveGithub(false)}
          >
            {busy === "github-save" ? "Saving…" : "Save allowlist"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={locked}
            onClick={() => saveGithub(true)}
          >
            {busy === "github-ingest" ? "Syncing…" : "Save & sync GitHub"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6">
        <p className="text-xs text-muted-foreground">
          Or re-embed everything currently on disk without uploading.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={locked}
          onClick={ingestAll}
        >
          {busy === "all" ? "Re-ingesting…" : "Re-ingest all sources"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-vita-teal/30 bg-vita-teal-soft/60 px-3 py-2 text-sm text-foreground">
          {success}
        </p>
      ) : null}

      {recentIngests.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent ingest runs
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {recentIngests.map((ev) => (
              <li key={ev.id}>
                <span className="font-medium text-foreground/80">{ev.type}</span>
                <span className="mx-1.5 text-border">·</span>
                {ev.summary}
                <span className="mx-1.5 text-border">·</span>
                {ev.createdAt}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
