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

  // Resend cannot send FROM public mailbox domains (gmail, yahoo, etc.).
  const blocked = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  if (blocked.includes(domain)) {
    console.warn(
      `RESEND_FROM_EMAIL uses blocked domain @${domain}; falling back to onboarding@resend.dev`,
    );
    return fallback;
  }

  return configured;
}

export async function sendMeetingRequestEmails(input: MeetingMailInput): Promise<{
  emailed: boolean;
  ownerEmailed: boolean;
  hrEmailed: boolean;
  ownerMessageId?: string;
  hrMessageId?: string;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      emailed: false,
      ownerEmailed: false,
      hrEmailed: false,
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
      return {
        emailed: false,
        ownerEmailed: false,
        hrEmailed: false,
        error: ownerResult.error.message,
      };
    }

    // Resend test mode (onboarding@resend.dev) can only email the account owner.
    // Skip HR confirmation when HR email isn't the owner — avoids noisy 403s.
    const hrIsOwner =
      input.hrEmail.trim().toLowerCase() === ownerEmail.trim().toLowerCase();

    if (!hrIsOwner && from.includes("onboarding@resend.dev")) {
      return {
        emailed: true,
        ownerEmailed: true,
        hrEmailed: false,
        ownerMessageId: ownerResult.data?.id,
        error:
          "Sajal was notified. HR auto-confirmation is skipped in Resend test mode (can only email your own address). Verify a domain at resend.com/domains to email external HRs automatically.",
      };
    }

    const hrResult = await resend.emails.send({
      from,
      to: input.hrEmail,
      replyTo: ownerEmail,
      subject: `Meeting request received — ${profile.identity.name}`,
      text: hrText,
    });

    if (hrResult.error) {
      return {
        emailed: true,
        ownerEmailed: true,
        hrEmailed: false,
        ownerMessageId: ownerResult.data?.id,
        error: `Sajal was notified. HR confirmation email failed: ${hrResult.error.message}`,
      };
    }

    return {
      emailed: true,
      ownerEmailed: true,
      hrEmailed: true,
      ownerMessageId: ownerResult.data?.id,
      hrMessageId: hrResult.data?.id,
    };
  } catch (err) {
    return {
      emailed: false,
      ownerEmailed: false,
      hrEmailed: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
