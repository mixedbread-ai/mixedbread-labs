import { z } from "zod";
import { cacheUntil } from "@/lib/api";
import { formatOf, PARSE_LIFETIME } from "@/lib/files";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { renderPage } from "@/lib/render";

/**
 * A page of a file the browser can't draw itself, as an image: a Word or
 * PowerPoint page, or an SVG or HEIC image. A file never changes, so browsers
 * and the CDN keep each page while its parse lasts.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ file: string; page: string }> }
) {
  const { file, page } = await params;
  const index = Number(page) - 1;
  if (
    !z.uuid().safeParse(file).success ||
    !Number.isInteger(index) ||
    index < 0 ||
    new URL(req.url).search
  ) {
    return new Response(null, { status: 404 });
  }

  const client = getMixedbreadClient();
  const [info, content] = await Promise.all([
    client.files.retrieve(file),
    client.files.content(file),
  ]).catch(() => []);
  const format = info && formatOf(info.filename);
  if (!format || !content) return new Response(null, { status: 404 });

  try {
    const bytes = new Uint8Array(await content.arrayBuffer());
    const { body, type } = await renderPage(format, bytes, index);
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": cacheUntil(
          Date.parse(info.created_at) + PARSE_LIFETIME
        ),
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 404 });
  }
}
