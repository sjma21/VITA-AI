"use client";

import { useCompletion } from "@ai-sdk/react";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { JD_MAX_CHARS } from "@/lib/limits";

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

export function JdFitPanel({ candidateName }: { candidateName: string }) {
  const [jd, setJd] = useState("");
  const { completion, complete, isLoading, error, setCompletion, stop } =
    useCompletion({
      api: "/api/jd-fit",
      streamProtocol: "text",
    });

  const remaining = JD_MAX_CHARS - jd.length;
  const tooLong = remaining < 0;

  async function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const text = jd.trim();
    if (!text || isLoading || tooLong) return;
    setCompletion("");
    await complete(text);
  }

  function onClear() {
    stop();
    setJd("");
    setCompletion("");
  }

  return (
    <section
      aria-label="JD fit analysis"
      className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/90 bg-card/90"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-sm font-semibold tracking-tight">Match JD</p>
          <p className="text-xs text-muted-foreground">
            Paste a job description to see how {candidateName} aligns
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading && !jd && !completion}
          onClick={onClear}
        >
          Clear
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-5">
        <form onSubmit={onAnalyze} className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Job description</span>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              disabled={isLoading}
              rows={10}
              placeholder="Paste the full JD here — role, requirements, tech stack, responsibilities…"
              className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground/80 focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20 disabled:opacity-60"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={`text-xs ${tooLong ? "text-destructive" : "text-muted-foreground"}`}
            >
              {tooLong
                ? `${Math.abs(remaining)} characters over limit`
                : `${remaining.toLocaleString()} characters left`}
            </p>
            <div className="flex gap-2">
              {isLoading ? (
                <Button type="button" variant="outline" onClick={() => stop()}>
                  Stop
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isLoading || !jd.trim() || tooLong}
              >
                {isLoading ? "Analyzing…" : "Analyze fit"}
              </Button>
            </div>
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
              <p className="text-sm font-semibold">Fit report</p>
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
                  Retrieving evidence and comparing against the JD…
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
