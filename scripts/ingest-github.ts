import { ingestGithub } from "../src/lib/ingest/github";

async function main() {
  const result = await ingestGithub();
  console.log("github ingest:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
