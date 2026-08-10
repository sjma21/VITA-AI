"use client";

import { useCompletion } from "@ai-sdk/react";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  PITCH_COMPANY_MAX,
  PITCH_NOTES_MAX,
  PITCH_ROLE_MAX,
} from "@/lib/limits";

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mb-2 font-heading text-lg text-foreground">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-2 mt-3 font-heading text-base text-foreground">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-1.5 mt-2.5 text-sm font-semibold text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  hr: () => <hr className="my-3 border-border/80" />,
};

export function CompanyPitchPanel({
  candidateName,
}: {
  candidateName: string;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");

  const { completion, complete, isLoading, error, setCompletion, stop } =
    useCompletion({
      api: "/api/company-pitch",
      streamProtocol: "text",
    });

  const companyOk = company.trim().length > 0 && company.length <= PITCH_COMPANY_MAX;
  const roleOk = role.trim().length > 0 && role.length <= PITCH_ROLE_MAX;
  const notesOk = notes.length <= PITCH_NOTES_MAX;
  const canSubmit = companyOk && roleOk && notesOk && !isLoading;

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCompletion("");
    await complete(`${company.trim()} — ${role.trim()}`, {
      body: {
        company: company.trim(),
        role: role.trim(),
        notes: notes.trim(),
      },
    });
  }

  function onClear() {
    stop();
    setCompany("");
    setRole("");
    setNotes("");
    setCompletion("");
  }

  return (
    <section
      aria-label="Company-tailored pitch"
      className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/90 bg-card/90"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-sm font-semibold tracking-tight">Tailored pitch</p>
          <p className="text-xs text-muted-foreground">
            Enter your company and role — Vita writes a short pitch about{" "}
            {candidateName}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading && !company && !role && !completion}
          onClick={onClear}
        >
          Clear
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-5">
        <form onSubmit={onGenerate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Company</span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isLoading}
                maxLength={PITCH_COMPANY_MAX + 20}
                placeholder="Acme AI"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20 disabled:opacity-60"
                required
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Role</span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
                maxLength={PITCH_ROLE_MAX + 20}
                placeholder="Full Stack AI Engineer"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20 disabled:opacity-60"
                required
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={5}
              placeholder="What you’re hiring for, stack, team context, must-haves…"
              className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground/80 focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20 disabled:opacity-60"
            />
            <p
              className={`text-xs ${
                notes.length > PITCH_NOTES_MAX
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {notes.length > PITCH_NOTES_MAX
                ? `${notes.length - PITCH_NOTES_MAX} characters over limit`
                : `${(PITCH_NOTES_MAX - notes.length).toLocaleString()} characters left`}
            </p>
          </label>

          <div className="flex justify-end gap-2">
            {isLoading ? (
              <Button type="button" variant="outline" onClick={() => stop()}>
                Stop
              </Button>
            ) : null}
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? "Writing…" : "Generate pitch"}
            </Button>
          </div>
        </form>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error.message}
          </p>
        )}

        {(completion || isLoading) && (
          <div className="vita-animate-fade-in space-y-2 border-t border-border/70 pt-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Pitch</p>
              {isLoading && (
                <span className="inline-flex gap-1">
                  <span className="vita-typing-dot size-1.5 rounded-full bg-vita-teal" />
                  <span className="vita-typing-dot size-1.5 rounded-full bg-vita-teal" />
                  <span className="vita-typing-dot size-1.5 rounded-full bg-vita-teal" />
                </span>
              )}
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm leading-relaxed">
              {completion ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {completion}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">
                  Pulling evidence and drafting a pitch for {company || "your company"}…
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
