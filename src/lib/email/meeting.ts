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
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  const fallback = "Vita <onboarding@resend.dev>";
  if (!configured) return fallback;

  const address = configured.includes("<")
    ? configured.slice(configured.indexOf("<") + 1, configured.indexOf(">"))
    : configured;
  const domain = address.split("@")[1]?.toLowerCase() ?? "";

  const blocked = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  if (blocked.includes(domain)) {
    console.warn(
      `RESEND_FROM_EMAIL uses blocked domain @${domain}; falling back to onboarding@resend.dev`,
    );
    return fallback;
  }

  return configured;
}

/** Notify owner only — no email is sent to the HR. */
export async function sendMeetingRequestEmails(input: MeetingMailInput): Promise<{
  emailed: boolean;
  ownerEmailed: boolean;
  ownerMessageId?: string;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      emailed: false,
      ownerEmailed: false,
      error: "RESEND_API_KEY is not configured — request saved in database only",
    };
  }

  const resend = new Resend(apiKey);
  const ownerEmail = getOwnerEmail();
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

  try {
    const ownerResult = await resend.emails.send({
      from,
      to: ownerEmail,
      replyTo: input.hrEmail,
      subject: `Vita meeting request from ${input.hrName}`,
      text: ownerText,
    });

    if (ownerResult.error) {
      return {
        emailed: false,
        ownerEmailed: false,
        error: ownerResult.error.message,
      };
    }

    return {
      emailed: true,
      ownerEmailed: true,
      ownerMessageId: ownerResult.data?.id,
    };
  } catch (err) {
    return {
      emailed: false,
      ownerEmailed: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
