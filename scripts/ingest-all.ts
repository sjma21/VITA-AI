import { ingestAll } from "../src/lib/ingest/all";

async function main() {
  const result = await ingestAll();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
