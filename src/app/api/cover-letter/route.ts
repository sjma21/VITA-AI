import { serveContentPdf, wantsDownload } from "@/lib/pdf-file";

export async function GET(request: Request) {
  return serveContentPdf("cover-letter.pdf", "Sajal_Mishra_Cover_Letter.pdf", {
    download: wantsDownload(request),
  });
}
