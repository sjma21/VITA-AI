import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendMeetingRequestEmails } from "@/lib/email/meeting";
import { createId } from "@/lib/id";

const bodySchema = z.object({
  hrName: z.string().trim().min(2).max(120),
  hrEmail: z.string().trim().email().max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  preferredTime: z.string().trim().min(3).max(300),
  timezone: z.string().trim().max(80).optional().or(z.literal("")),
  agenda: z.string().trim().min(10).max(4000),
});

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const id = createId();

    if (!prisma.meetingRequest) {
      return NextResponse.json(
        {
          error:
            "Database client is outdated. Restart the Next.js dev server (pnpm dev) and try again.",
        },
        { status: 503 },
      );
    }

    const record = await prisma.meetingRequest.create({
      data: {
        id,
        hrName: data.hrName,
        hrEmail: data.hrEmail.toLowerCase(),
        company: data.company || null,
        preferredTime: data.preferredTime,
        timezone: data.timezone || null,
        agenda: data.agenda,
        status: "pending",
      },
    });

    const mail = await sendMeetingRequestEmails({
      requestId: record.id,
      hrName: data.hrName,
      hrEmail: data.hrEmail,
      company: data.company || undefined,
      preferredTime: data.preferredTime,
      timezone: data.timezone || undefined,
      agenda: data.agenda,
    });

    await prisma.meetingRequest.update({
      where: { id: record.id },
      data: {
        status: mail.emailed ? "emailed" : "failed",
        emailError: mail.error ?? null,
      },
    });

    await prisma.event.create({
      data: {
        type: "meeting_request",
        payload: {
          id: record.id,
          hrEmail: data.hrEmail,
          emailed: mail.emailed,
          ownerEmailed: mail.ownerEmailed,
          error: mail.error ?? null,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      id: record.id,
      emailed: mail.emailed,
      ownerEmailed: mail.ownerEmailed,
      message: mail.ownerEmailed
        ? "Request received. Sajal has been notified by email and will follow up with you."
        : "Request saved. Email delivery is not configured yet — Sajal can still see it in the database.",
      warning: mail.error,
    });
  } catch (err) {
    console.error("meeting-request failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not submit meeting request",
      },
      { status: 500 },
    );
  }
}
