"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { JdFitPanel } from "@/components/jd-fit-panel";

type Mode = "chat" | "jd";

export function Workspace({
  candidateName,
}: {
  candidateName: string;
}) {
  const [mode, setMode] = useState<Mode>("chat");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        role="tablist"
        aria-label="Vita modes"
        className="inline-flex w-fit gap-1 rounded-xl border border-border bg-card/80 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "chat"}
          onClick={() => setMode("chat")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "chat"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Ask Vita
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "jd"}
          onClick={() => setMode("jd")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "jd"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Match JD
        </button>
      </div>

      {mode === "chat" ? (
        <ChatPanel candidateName={candidateName} />
      ) : (
        <JdFitPanel candidateName={candidateName} />
      )}
    </div>
  );
}
