"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type FormState = {
  hrName: string;
  hrEmail: string;
  company: string;
  preferredTime: string;
  timezone: string;
  agenda: string;
};

const empty: FormState = {
  hrName: "",
  hrEmail: "",
  company: "",
  preferredTime: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  agenda: "",
};

export function MeetingRequestPanel({
  candidateName,
}: {
  candidateName: string;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const res = await fetch("/api/meeting-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const raw = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        message?: string;
        warning?: string;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        throw new Error(
          res.ok
            ? "Unexpected server response"
            : `Server error (${res.status}). Restart pnpm dev and try again.`,
        );
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not submit meeting request");
      }

      setSuccess(data.message || "Request submitted.");
      if (data.warning) setWarning(data.warning);
      setForm((prev) => ({
        ...empty,
        timezone: prev.timezone,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Book a call"
      className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/90 bg-card/90"
    >
      <div className="border-b border-border/80 px-4 py-3.5 sm:px-5">
        <p className="text-sm font-semibold tracking-tight">Book a call</p>
        <p className="text-xs text-muted-foreground">
          Request a conversation with {candidateName}. You’ll get a follow-up by
          email to confirm timing.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm sm:col-span-1">
            <span className="font-medium">Your name</span>
            <input
              required
              value={form.hrName}
              onChange={(e) => update("hrName", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
              placeholder="Alex Recruiter"
              disabled={busy}
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Work email</span>
            <input
              required
              type="email"
              value={form.hrEmail}
              onChange={(e) => update("hrEmail", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
              placeholder="alex@company.com"
              disabled={busy}
            />
          </label>
        </div>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Company (optional)</span>
          <input
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
            placeholder="Acme Inc."
            disabled={busy}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Preferred time</span>
            <input
              required
              value={form.preferredTime}
              onChange={(e) => update("preferredTime", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
              placeholder="Thu 14 Aug, 4–5pm or flexible next week"
              disabled={busy}
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Timezone</span>
            <input
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
              placeholder="Asia/Kolkata"
              disabled={busy}
            />
          </label>
        </div>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Agenda</span>
          <textarea
            required
            rows={6}
            value={form.agenda}
            onChange={(e) => update("agenda", e.target.value)}
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 leading-relaxed outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
            placeholder="Intro call about Full Stack AI Engineer role — discuss Syvora work, Veritas/RAG projects, and team fit."
            disabled={busy}
          />
        </label>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-xl border border-vita-teal/30 bg-vita-teal-soft/60 px-3 py-2 text-sm text-foreground">
            {success}
          </p>
        )}
        {warning && (
          <p className="text-xs text-muted-foreground">{warning}</p>
        )}

        <div className="mt-auto flex justify-end pt-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Request meeting"}
          </Button>
        </div>
      </form>
    </section>
  );
}
