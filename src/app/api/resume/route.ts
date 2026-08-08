import { readFileSync } from "node:fs";
import { contentPath } from "@/lib/env";

export async function GET() {
  const file = readFileSync(contentPath("resume.pdf"));
  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Sajal-Mishra-Resume.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
