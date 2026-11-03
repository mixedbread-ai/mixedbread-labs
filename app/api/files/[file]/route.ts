import { z } from "zod";
import { getMixedbreadClient } from "@/lib/mixedbread";

/**
 * A file's bytes, for the parse view to draw its pages. Streamed, so a large
 * file passes the function's response limit; a file id never changes what it
 * holds, so browsers and the CDN keep it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  if (!z.uuid().safeParse(file).success) {
    return new Response(null, { status: 404 });
  }

  const client = getMixedbreadClient();
  const [info, content] = await Promise.all([
    client.files.retrieve(file),
    client.files.content(file),
  ]).catch(() => []);
  if (!info || !content?.body) return new Response(null, { status: 404 });

  return new Response(content.body, {
    headers: {
      "Content-Type": info.mime_type,
      "Content-Length": String(info.bytes),
      // A file id never changes what it holds, so the CDN keeps it too
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
