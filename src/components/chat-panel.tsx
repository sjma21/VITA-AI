"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

type Citation = {
  source: string;
  sourceRef: string | null;
  score: number;
};

type VitaMetadata = {
  citations?: Citation[];
};

const STARTERS = [
  "What is the tech stack?",
  "Summarize Syvora experience.",
  "Top AI / agent projects?",
  "Education background?",
];

function messageText(message: {
  parts?: { type: string; text?: string }[];
}): string {
  if (!message.parts?.length) return "";
  return message.parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("\n");
}

function citationLabel(c: Citation): string {
  if (c.source === "github" && c.sourceRef) {
    const repo = c.sourceRef.split(":")[1] ?? c.sourceRef;
    return `github:${repo}`;
  }
  if (c.sourceRef?.startsWith("cover-letter")) return "cover letter";
  if (c.source === "resume") return "resume";
  if (c.source === "profile") return "profile";
  return c.source;
}

function uniqueCitationLabels(citations: Citation[] | undefined): string[] {
  if (!citations?.length) return [];
  const labels = citations.map(citationLabel);
  return [...new Set(labels)].slice(0, 6);
}

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
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-vita-teal underline underline-offset-2"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-border/80" />,
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded-md bg-background/80 px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
};

export function ChatPanel({ candidateName }: { candidateName: string }) {
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error, setMessages } = useChat();

  const busy = status === "submitted" || status === "streaming";

  const visible = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: messageText(m),
        citations: uniqueCitationLabels(
          (m.metadata as VitaMetadata | undefined)?.citations,
        ),
      })),
    [messages],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  async function onStarter(text: string) {
    if (busy) return;
    await sendMessage({ text });
  }

  return (
    <section
      aria-label="Ask Vita chat"
      className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/90 bg-card/90"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-sm font-semibold tracking-tight">Ask Vita</p>
          <p className="text-xs text-muted-foreground">
            About {candidateName} — profile, resume, GitHub
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy || messages.length === 0}
          onClick={() => setMessages([])}
        >
          Clear
        </Button>
      </div>

      <div
        ref={scrollerRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
      >
        {visible.length === 0 && (
          <div className="vita-animate-fade-in space-y-4">
            <p className="text-sm text-muted-foreground">
              Start with a recruiter-style question:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onStarter(q)}
                  className="rounded-xl border border-border bg-background/70 px-3.5 py-3 text-left text-sm text-foreground transition hover:border-vita-teal/40 hover:bg-vita-teal-soft/50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {visible.map((m) => (
          <div
            key={m.id}
            className={`vita-animate-fade-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] sm:max-w-[88%] ${
                m.role === "user"
                  ? "rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground"
                  : "w-full"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl rounded-bl-md border border-border/80 bg-background/80 px-4 py-3 text-sm leading-relaxed text-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                  {m.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                      <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Sources
                      </span>
                      {m.citations.map((label) => (
                        <span
                          key={label}
                          className="rounded-md bg-vita-teal-soft px-2 py-0.5 text-[11px] font-medium text-vita-teal"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <span className="inline-flex gap-1">
              <span className="vita-typing-dot size-1.5 rounded-full bg-vita-teal" />
              <span className="vita-typing-dot size-1.5 rounded-full bg-vita-teal" />
              <span className="vita-typing-dot size-1.5 rounded-full bg-vita-teal" />
            </span>
            Vita is answering…
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error.message}
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex gap-2 border-t border-border/80 bg-card p-3 sm:p-4"
      >
        <input
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about experience, stack, projects…"
          disabled={busy}
          aria-label="Message"
        />
        <Button type="submit" disabled={busy || !input.trim()} className="px-5">
          Send
        </Button>
      </form>
    </section>
  );
}
