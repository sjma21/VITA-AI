"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { CompanyPitchPanel } from "@/components/company-pitch-panel";
import { JdFitPanel } from "@/components/jd-fit-panel";
import { MeetingRequestPanel } from "@/components/meeting-request-panel";
import { ProofPackPanel } from "@/components/proof-pack-panel";
import type { ProofPack } from "@/lib/proof-pack";

type Mode = "chat" | "jd" | "pitch" | "proof" | "meet";

export function Workspace({
  candidateName,
  proofPack,
}: {
  candidateName: string;
  proofPack: ProofPack;
}) {
  const [mode, setMode] = useState<Mode>("chat");

  const tabs: { id: Mode; label: string }[] = [
    { id: "chat", label: "Ask Vita" },
    { id: "jd", label: "Match JD" },
    { id: "pitch", label: "Tailored pitch" },
    { id: "proof", label: "Proof pack" },
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
      ) : mode === "pitch" ? (
        <CompanyPitchPanel candidateName={candidateName} />
      ) : mode === "proof" ? (
        <ProofPackPanel pack={proofPack} />
      ) : (
        <MeetingRequestPanel candidateName={candidateName} />
      )}
    </div>
  );
}
