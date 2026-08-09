import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="text-xs font-medium text-vita-teal underline-offset-4 hover:underline"
        >
          ← Inbox
        </Link>
        <h1 className="mt-2 font-heading text-2xl tracking-tight text-foreground">
          Chat thread
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-mono">{conversation.id}</span>
          <span className="mx-1.5 text-border">·</span>
          Updated {formatWhen(conversation.updatedAt)}
        </p>
      </div>

      {conversation.messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages in this thread.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {conversation.messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <li
                key={m.id}
                className={`rounded-2xl border px-4 py-3 ${
                  isUser
                    ? "border-border/80 bg-background"
                    : "border-vita-teal/25 bg-vita-teal-soft/40"
                }`}
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {m.role}
                  </span>
                  <time
                    dateTime={m.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {formatWhen(m.createdAt)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {m.content}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
