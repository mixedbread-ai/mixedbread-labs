import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, isMissing, rejectBots } from "@/lib/api";
import { getMixedbreadClient } from "@/lib/mixedbread";

const BodySchema = z.object({
  entries: z
    .array(z.object({ kind: z.enum(["parse", "chat"]), id: z.uuid() }))
    .max(50),
});

/** At most this many lookups at once, as they share the key's rate limit with every page */
const CONCURRENCY = 8;

/**
 * Which of a browser's sidebar entries the API no longer has: expired, or
 * deleted by whoever made them. Only a "not found" counts; one that can't be
 * checked, such as in an outage, stays. The API can't look up several at
 * once, so each is its own call.
 */
export async function POST(req: Request) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return badRequest("Invalid history.");

  const client = getMixedbreadClient();
  const queue = body.data.entries.slice();
  const gone: string[] = [];
  async function worker() {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      const { kind, id } = entry;
      await (kind === "parse"
        ? client.parsing.jobs.retrieve(id)
        : client.stores.retrieve(id)
      ).catch((error: unknown) => {
        if (isMissing(error)) gone.push(id);
      });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return NextResponse.json({ gone });
}
