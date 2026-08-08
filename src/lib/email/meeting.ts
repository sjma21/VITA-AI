import { Resend } from "resend";
import { loadProfile } from "@/lib/profile";

export type MeetingMailInput = {
  hrName: string;
  hrEmail: string;
  company?: string;
  preferredTime: string;
  timezone?: string;
  agenda: string;
  requestId: string;
};

function getOwnerEmail() {
  return (
    process.env.OWNER_EMAIL?.trim() ||
    loadProfile().identity.email ||
    "sajalmishra361@gmail.com"
  );
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "Vita <onboarding@resend.dev>";
}

export async function sendMeetingRequestEmails(input: MeetingMailInput): Promise<{
  emailed: boolean;
  ownerMessageId?: string;
  hrMessageId?: string;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      emailed: false,
      error: "RESEND_API_KEY is not configured — request saved in database only",
    };
  }

  const resend = new Resend(apiKey);
  const ownerEmail = getOwnerEmail();
  const profile = loadProfile();
  const from = getFromEmail();
  const companyLine = input.company ? `\nCompany: ${input.company}` : "";
  const tzLine = input.timezone ? `\nTimezone: ${input.timezone}` : "";

  const ownerText = `New meeting request via Vita

Request ID: ${input.requestId}
HR name: ${input.hrName}
HR email: ${input.hrEmail}${companyLine}
Preferred time: ${input.preferredTime}${tzLine}

Agenda:
${input.agenda}

Reply to ${input.hrEmail} to confirm the slot and send a calendar invite.
`;

  const hrText = `Hi ${input.hrName},

Thanks for reaching out via Vita about speaking with ${profile.identity.name}.

Your meeting request was received:
- Preferred time: ${input.preferredTime}${tzLine ? `\n- ${tzLine.trim()}` : ""}
- Agenda: ${input.agenda}

${profile.identity.name} will review and follow up at this email (${input.hrEmail}) to confirm timing.

— Vita (on behalf of ${profile.identity.name})
${profile.identity.email}
`;

  try {
    const ownerResult = await resend.emails.send({
      from,
      to: ownerEmail,
      replyTo: input.hrEmail,
      subject: `Vita meeting request from ${input.hrName}`,
      text: ownerText,
    });

    if (ownerResult.error) {
      return { emailed: false, error: ownerResult.error.message };
    }

    const hrResult = await resend.emails.send({
      from,
      to: input.hrEmail,
      replyTo: ownerEmail,
      subject: `Meeting request received — ${profile.identity.name}`,
      text: hrText,
    });

    // Owner email succeeded; HR confirmation may fail on free Resend without domain.
    if (hrResult.error) {
      return {
        emailed: true,
        ownerMessageId: ownerResult.data?.id,
        error: `Owner notified; HR confirmation failed: ${hrResult.error.message}`,
      };
    }

    return {
      emailed: true,
      ownerMessageId: ownerResult.data?.id,
      hrMessageId: hrResult.data?.id,
    };
  } catch (err) {
    return {
      emailed: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
