import { ingestGithub } from "@/lib/ingest/github";
import { ingestProfile, ingestResume } from "@/lib/ingest/resume";

export async function ingestAll() {
  const profile = await ingestProfile();
  const resume = await ingestResume();
  const github = await ingestGithub();
  return { profile, resume, github };
}
