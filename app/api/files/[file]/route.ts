import { z } from "zod";
import { cacheUntil } from "@/lib/api";
import { PARSE_LIFETIME } from "@/lib/files";
import { getMixedbreadClient } from "@/lib/mixedbread";

// What the parse view draws. Anything else, an uploaded HTML page or SVG
// among them, comes as a download, so it can't run script on this origin.
const INLINE = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

/**
 * A file's bytes, for the parse view to draw its pages. Streamed, so a large
 * file passes the function's response limit. A file id never changes what it
 * holds, so browsers and the CDN keep it while its parse lasts.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  // A query string would make every request miss the CDN's copy
  if (!z.uuid().safeParse(file).success || new URL(req.url).search) {
    return new Response(null, { status: 404 });
  }

  const client = getMixedbreadClient();
  const [info, content] = await Promise.all([
    client.files.retrieve(file),
    client.files.content(file),
  ]).catch(() => []);
  if (!info || !content?.body) return new Response(null, { status: 404 });

  const inline = INLINE.includes(info.mime_type);
  return new Response(content.body, {
    headers: {
      "Content-Type": inline ? info.mime_type : "application/octet-stream",
      "Content-Disposition": inline ? "inline" : "attachment",
      "Content-Length": String(info.bytes),
      "Cache-Control": cacheUntil(Date.parse(info.created_at) + PARSE_LIFETIME),
    },
  });
}
