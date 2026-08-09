"use client";

import { useId, useState, type ReactNode } from "react";

export function AdminCollapsible({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="rounded-2xl border border-border/80 bg-card/50">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-muted/40 sm:px-5"
      >
        <div className="min-w-0">
          <p className="font-heading text-lg text-foreground">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {badge ? (
            <span className="text-xs text-muted-foreground">{badge}</span>
          ) : null}
          <span
            aria-hidden
            className={`inline-flex size-7 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground transition ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {open ? (
        <div
          id={panelId}
          className="border-t border-border/70 px-4 py-5 sm:px-5"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
