"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminCollapsible } from "@/components/admin-collapsible";

const PAGE_SIZE = 3;

export type AdminChatItem = {
  id: string;
  preview: string;
  messageCount: number;
  updatedAtLabel: string;
  updatedAtIso: string;
};

export function AdminChatsSection({ chats }: { chats: AdminChatItem[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = chats.slice(0, visible);
  const remaining = Math.max(0, chats.length - visible);

  return (
    <AdminCollapsible
      title="Recent chats"
      subtitle="Expand to browse Vita conversation history."
      badge={`${chats.length} total`}
      defaultOpen={false}
    >
      {chats.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          No chats saved yet. Ask Vita questions on the public site to see
          threads here.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border/70 border-y border-border/70">
            {shown.map((c) => (
              <li key={c.id} className="py-3.5 first:pt-3 last:pb-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <Link
                    href={`/admin/chats/${c.id}`}
                    className="text-sm font-medium text-vita-teal underline-offset-4 hover:underline"
                  >
                    {c.preview}
                  </Link>
                  <time
                    dateTime={c.updatedAtIso}
                    className="text-xs text-muted-foreground"
                  >
                    {c.updatedAtLabel}
                  </time>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.messageCount} message{c.messageCount === 1 ? "" : "s"}
                  <span className="mx-1.5 text-border">·</span>
                  <span className="font-mono">{c.id.slice(0, 10)}…</span>
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {shown.length} of {chats.length}
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
            ) : chats.length > PAGE_SIZE ? (
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
