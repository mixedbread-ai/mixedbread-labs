import { z } from "zod";
import { cacheUntil } from "@/lib/api";
import { getMixedbreadClient } from "@/lib/mixedbread";

const ParamsSchema = z.object({
  store: z.uuid(),
  file: z.uuid(),
  index: z.coerce.number().int().nonnegative(),
});

// The published SDK predates the field, so it is read off the chunk here
const DisplaySchema = z.object({ display_url: z.string().nullish() });

/** The widest the store resizes to: next/image makes every smaller size from it */
const SOURCE_WIDTH = 2048;

/**
 * A page's scan at an address of its own. The store signs a new S3 link into
 * every response, and next/image caches by address, so behind the links each
 * search resized every page again; behind this route each size is made once.
 * The optimizer takes a same-site image as a body, not a redirect, so the
 * image streams through.
 */
export async function GET(
  req: Request,
  {
    params,
  }: { params: Promise<{ store: string; file: string; index: string }> }
) {
  const page = ParamsSchema.safeParse(await params);
  // A query string would make every request miss the CDN's copy
  if (!page.success || new URL(req.url).search) {
    return new Response(null, { status: 404 });
  }

  const client = getMixedbreadClient();
  const [{ data }, { expires_at }] = await Promise.all([
    client.stores.listChunks({
      store_identifiers: [page.data.store],
      top_k: 1,
      filters: {
        all: [
          { key: "file_id", operator: "eq", value: page.data.file },
          { key: "chunk_index", operator: "eq", value: page.data.index },
        ],
      },
    }),
    client.stores.retrieve(page.data.store),
  ]);
  const chunk = data[0];
  if (chunk?.type !== "image_url" || !chunk.image_url) {
    return new Response(null, { status: 404 });
  }

  // The store's resized copy is a fraction of the scan's size; the scan is
  // the way back where there is none
  const display = DisplaySchema.safeParse(chunk).data?.display_url;
  const scan = await fetch(
    display ? `${display}&w=${SOURCE_WIDTH}&fm=webp` : chunk.image_url.url
  );
  if (!scan.ok || !scan.body) return new Response(null, { status: 502 });
  return new Response(scan.body, {
    headers: {
      "Content-Type": scan.headers.get("Content-Type") ?? "image/jpeg",
      // A file's pages never change: uploading it again makes a new file id.
      // Kept until the chat's current expiry, which use pushes back.
      "Cache-Control": expires_at
        ? cacheUntil(Date.parse(expires_at))
        : "no-store",
    },
  });
}
