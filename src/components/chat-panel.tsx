"use client";

import { useChat } from "@ai-sdk/react";
import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

const STARTERS = [
  "What is Sajal's tech stack?",
  "Summarize his experience at Syvora.",
  "What are his strongest AI / agent projects?",
  "What is his education background?",
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

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mb-2 text-base font-semibold">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-2 mt-3 text-sm font-semibold">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-1.5 mt-2.5 text-sm font-semibold">{children}</h3>
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
    <strong className="font-semibold">{children}</strong>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-border/70" />,
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-background/60 px-1 py-0.5 text-[0.85em]">
      {children}
    </code>
  ),
};

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, setMessages } = useChat();

  const busy = status === "submitted" || status === "streaming";

  const visible = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: messageText(m),
      })),
    [messages],
  );

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
    <div className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Ask Vita</p>
          <p className="text-xs text-muted-foreground">
            Grounded answers from profile, resume, and GitHub
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

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {visible.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Try a recruiter-style question:
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onStarter(q)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-left text-xs text-foreground transition hover:bg-muted"
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
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {m.text}
                </ReactMarkdown>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {busy && (
          <p className="text-xs text-muted-foreground">Vita is thinking…</p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error.message}
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex gap-2 border-t border-border/70 p-3"
      >
        <input
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about experience, stack, projects…"
          disabled={busy}
          aria-label="Message"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
