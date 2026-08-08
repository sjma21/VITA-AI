"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { JdFitPanel } from "@/components/jd-fit-panel";
import { MeetingRequestPanel } from "@/components/meeting-request-panel";

type Mode = "chat" | "jd" | "meet";

export function Workspace({
  candidateName,
}: {
  candidateName: string;
}) {
  const [mode, setMode] = useState<Mode>("chat");

  const tabs: { id: Mode; label: string }[] = [
    { id: "chat", label: "Ask Vita" },
    { id: "jd", label: "Match JD" },
    { id: "meet", label: "Book a call" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        role="tablist"
        aria-label="Vita modes"
        className="inline-flex w-fit flex-wrap gap-1 rounded-xl border border-border bg-card/80 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "chat" ? (
        <ChatPanel candidateName={candidateName} />
      ) : mode === "jd" ? (
        <JdFitPanel candidateName={candidateName} />
      ) : (
        <MeetingRequestPanel candidateName={candidateName} />
      )}
    </div>
  );
}
