import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import { MAX_CHAT_FILES } from "@/lib/files";
import { getMixedbreadClient } from "@/lib/mixedbread";

const BodySchema = z.object({
  files: z
    .array(z.object({ id: z.uuid(), filename: z.string().max(255) }))
    .min(1)
    .max(MAX_CHAT_FILES),
});

/** How long a chat lasts once nobody uses it */
const EXPIRES_AFTER_DAYS = 30;

/** Makes a chat: a store that indexes the uploaded files */
export async function POST(req: Request) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return badRequest("Pick up to 10 files.");

  const { files } = body.data;
  try {
    const store = await getMixedbreadClient().stores.create({
      // The API takes a store without a name but can't save one: it answers
      // 500. Names are unique in the organization, so each chat gets its own.
      name: `chat-${crypto.randomUUID()}`,
      description: files.map(({ filename }) => filename).join(", "),
      expires_after: { anchor: "last_active_at", days: EXPIRES_AFTER_DAYS },
      file_ids: files.map(({ id }) => id),
    });
    return NextResponse.json({ id: store.id });
  } catch (error) {
    return apiError(error);
  }
}
