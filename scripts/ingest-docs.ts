import { ingestProfile, ingestResume } from "../src/lib/ingest/resume";

async function main() {
  const target = process.argv[2] ?? "all-docs";

  if (target === "profile") {
    const result = await ingestProfile();
    console.log("profile ingest:", result);
    return;
  }

  if (target === "resume") {
    const result = await ingestResume();
    console.log("resume ingest:", result);
    return;
  }

  const profile = await ingestProfile();
  const resume = await ingestResume();
  console.log("profile ingest:", profile);
  console.log("resume ingest:", resume);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
