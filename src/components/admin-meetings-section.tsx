"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminCollapsible } from "@/components/admin-collapsible";

const PAGE_SIZE = 3;

export type AdminMeetingItem = {
  id: string;
  hrName: string;
  hrEmail: string;
  company: string | null;
  preferredTime: string;
  timezone: string | null;
  agenda: string;
  status: string;
  emailError: string | null;
  createdAtLabel: string;
  createdAtIso: string;
};

export function AdminMeetingsSection({
  meetings,
}: {
  meetings: AdminMeetingItem[];
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = meetings.slice(0, visible);
  const remaining = Math.max(0, meetings.length - visible);

  return (
    <AdminCollapsible
      title="Meeting requests"
      subtitle="From Book a call — expand to review and reply."
      badge={`${meetings.length} total`}
      defaultOpen={false}
    >
      {meetings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          No meeting requests yet. They appear here when someone uses Book a
          call.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border/70 border-y border-border/70">
            {shown.map((m) => (
              <li key={m.id} className="py-4 first:pt-3 last:pb-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {m.hrName}
                    {m.company ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {m.company}
                      </span>
                    ) : null}
                  </p>
                  <time
                    dateTime={m.createdAtIso}
                    className="text-xs text-muted-foreground"
                  >
                    {m.createdAtLabel}
                  </time>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <a
                    href={`mailto:${m.hrEmail}`}
                    className="text-vita-teal underline-offset-4 hover:underline"
                  >
                    {m.hrEmail}
                  </a>
                  <span className="mx-1.5 text-border">·</span>
                  Prefers: {m.preferredTime}
                  {m.timezone ? ` (${m.timezone})` : ""}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {m.agenda}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Status: {m.status}
                  {m.emailError ? ` — ${m.emailError}` : ""}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {shown.length} of {meetings.length}
            </p>
            {remaining > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Load more ({Math.min(PAGE_SIZE, remaining)})
              </Button>
            ) : meetings.length > PAGE_SIZE ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setVisible(PAGE_SIZE)}
              >
                Show less
              </Button>
            ) : null}
          </div>
        </>
      )}
    </AdminCollapsible>
  );
}
