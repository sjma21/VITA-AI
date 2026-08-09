import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function preview(text: string, max = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export default async function AdminInboxPage() {
  const [meetings, conversations] = await Promise.all([
    prisma.meetingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-3xl tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meeting requests and recent Vita chats — private to you.
        </p>
      </div>

      <section aria-labelledby="admin-meetings">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2
            id="admin-meetings"
            className="font-heading text-lg text-foreground"
          >
            Meeting requests
          </h2>
          <span className="text-xs text-muted-foreground">
            {meetings.length} shown
          </span>
        </div>

        {meetings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No meeting requests yet. They appear here when someone uses Book a
            call.
          </p>
        ) : (
          <ul className="divide-y divide-border/70 border-y border-border/70">
            {meetings.map((m) => (
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
                    dateTime={m.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {formatWhen(m.createdAt)}
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
        )}
      </section>

      <section aria-labelledby="admin-chats">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="admin-chats" className="font-heading text-lg text-foreground">
            Recent chats
          </h2>
          <span className="text-xs text-muted-foreground">
            {conversations.length} shown
          </span>
        </div>

        {conversations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No chats saved yet. Ask Vita questions on the public site to see
            threads here.
          </p>
        ) : (
          <ul className="divide-y divide-border/70 border-y border-border/70">
            {conversations.map((c) => {
              const first = c.messages[0];
              return (
                <li key={c.id} className="py-3.5 first:pt-3 last:pb-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link
                      href={`/admin/chats/${c.id}`}
                      className="text-sm font-medium text-vita-teal underline-offset-4 hover:underline"
                    >
                      {first
                        ? preview(first.content)
                        : `Conversation ${c.id.slice(0, 8)}`}
                    </Link>
                    <time
                      dateTime={c.updatedAt.toISOString()}
                      className="text-xs text-muted-foreground"
                    >
                      {formatWhen(c.updatedAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c._count.messages} message
                    {c._count.messages === 1 ? "" : "s"}
                    <span className="mx-1.5 text-border">·</span>
                    <span className="font-mono">{c.id.slice(0, 10)}…</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
