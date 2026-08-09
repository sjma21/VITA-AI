import { AdminKnowledgePanel } from "@/components/admin-knowledge-panel";
import { AdminMeetingsSection } from "@/components/admin-meetings-section";
import { AdminChatsSection } from "@/components/admin-chats-section";
import { contentFileMeta, readProfileYaml } from "@/lib/content-admin";
import { loadProfile } from "@/lib/profile";
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

function summarizeIngestPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "completed";
  const p = payload as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof p.inserted === "number") parts.push(`${p.inserted} chunks`);
  if (typeof p.deleted === "number") parts.push(`${p.deleted} removed`);
  if (typeof p.source === "string") parts.push(String(p.source));
  if (Array.isArray(p.repos)) parts.push(`${p.repos.length} repos`);
  if (typeof p.chars === "number") parts.push(`${p.chars} chars`);
  return parts.length ? parts.join(", ") : "completed";
}

export default async function AdminInboxPage() {
  const profile = loadProfile();
  const resumeMeta = contentFileMeta("resume");
  const coverMeta = contentFileMeta("cover-letter");

  const [meetings, conversations, chunkGroups, ingestEvents] =
    await Promise.all([
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
      prisma.chunk.groupBy({
        by: ["source"],
        _count: { _all: true },
        orderBy: { source: "asc" },
      }),
      prisma.event.findMany({
        where: {
          type: {
            in: ["ingest_profile", "ingest_resume", "ingest_github"],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const chunkCounts = chunkGroups.map((g) => ({
    source: g.source,
    count: g._count._all,
  }));

  const recentIngests = ingestEvents.map((ev) => ({
    id: ev.id,
    type: ev.type.replace(/^ingest_/, ""),
    createdAt: formatWhen(ev.createdAt),
    summary: summarizeIngestPayload(ev.payload),
  }));

  const meetingItems = meetings.map((m) => ({
    id: m.id,
    hrName: m.hrName,
    hrEmail: m.hrEmail,
    company: m.company,
    preferredTime: m.preferredTime,
    timezone: m.timezone,
    agenda: m.agenda,
    status: m.status,
    emailError: m.emailError,
    createdAtLabel: formatWhen(m.createdAt),
    createdAtIso: m.createdAt.toISOString(),
  }));

  const chatItems = conversations.map((c) => {
    const first = c.messages[0];
    return {
      id: c.id,
      preview: first
        ? preview(first.content)
        : `Conversation ${c.id.slice(0, 8)}`,
      messageCount: c._count.messages,
      updatedAtLabel: formatWhen(c.updatedAt),
      updatedAtIso: c.updatedAt.toISOString(),
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight text-foreground">
          Admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Expand a section to update knowledge, review meetings, or browse
          chats. Lists show 3 at a time — use Load more for the next batch.
        </p>
      </div>

      <AdminKnowledgePanel
        initialYaml={readProfileYaml()}
        githubAllowlist={profile.github.allowlist}
        resumeMeta={{
          exists: resumeMeta.exists,
          bytes: resumeMeta.bytes,
        }}
        coverMeta={{
          exists: coverMeta.exists,
          bytes: coverMeta.bytes,
        }}
        chunkCounts={chunkCounts}
        recentIngests={recentIngests}
      />

      <AdminMeetingsSection meetings={meetingItems} />
      <AdminChatsSection chats={chatItems} />
    </div>
  );
}
