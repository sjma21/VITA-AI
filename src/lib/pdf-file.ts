import { existsSync, readFileSync } from "node:fs";
import { contentPath } from "@/lib/env";

export function serveContentPdf(
  filename: string,
  downloadName: string,
  opts?: { download?: boolean },
): Response {
  const path = contentPath(filename);
  if (!existsSync(path)) {
    return new Response("Not found", { status: 404 });
  }

  const file = readFileSync(path);
  const disposition = opts?.download ? "attachment" : "inline";

  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${downloadName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function wantsDownload(request: Request): boolean {
  const url = new URL(request.url);
  const q = url.searchParams.get("download");
  return q === "1" || q === "true";
}
