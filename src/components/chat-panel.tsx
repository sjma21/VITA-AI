"use client";

import { useChat } from "@ai-sdk/react";
import { useMemo, useState } from "react";
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
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.text}
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
