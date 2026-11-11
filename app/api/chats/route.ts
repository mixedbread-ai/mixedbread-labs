import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import { DEFAULT_CHAT_OPTIONS } from "@/lib/chat";
import { formatOf, MAX_CHAT_FILES } from "@/lib/files";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { isOwner, ownerToken } from "@/lib/owner";
import { MODES } from "@/lib/parse";

const BodySchema = z.object({
  files: z
    .array(
      z.object({
        id: z.uuid(),
        filename: z.string().max(255),
        token: z.string().max(100).optional(),
      })
    )
    .min(1)
    .max(MAX_CHAT_FILES),
  options: z
    .object({
      mode: z.enum(MODES.map(({ value }) => value)),
    })
    .default(DEFAULT_CHAT_OPTIONS),
});

/** How long a chat lasts once nobody uses it */
const EXPIRES_AFTER_DAYS = 30;

/** Named so chats stay on V3 whatever the API creates stores on by default */
const STORE_ENCODER = "mixedbread-ai/mxbai-wholembed-v3";

/** Makes a chat: a store that indexes the uploaded files */
export async function POST(req: Request) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return badRequest("Pick up to 10 files.");

  const { files, options } = body.data;
  const client = getMixedbreadClient();
  try {
    const store = await client.stores.create(
      {
        // The API takes a store without a name but can't save one: it answers
        // 500. Names are unique in the organization, so each chat gets its own.
        name: `chat-${crypto.randomUUID()}`,
        description: files.map(({ filename }) => filename).join(", "),
        expires_after: { anchor: "last_active_at", days: EXPIRES_AFTER_DAYS },
      },
      { query: { _encoder: STORE_ENCODER } }
    );
    // Files given to `stores.create` are parsed fast, as text alone, so each
    // is added with the mode picked. High quality makes a chunk of each page,
    // with its image and the layout that search and citations box; text files
    // have no pages, so they always go fast.
    try {
      await Promise.all(
        files.map(({ id, filename }) =>
          client.stores.files.create(store.id, {
            file_id: id,
            config: {
              parsing_strategy: formatOf(filename) ? options.mode : "fast",
            },
          })
        )
      );
    } catch (error) {
      await client.stores.delete(store.id).catch(() => undefined);
      throw error;
    }
    // Deleting a chat deletes its files, so only a chat of files this browser
    // uploaded gets a token to delete it
    const ownsFiles = files.every(({ id, token }) =>
      isOwner("file", id, token)
    );
    return NextResponse.json({
      id: store.id,
      token: ownsFiles ? ownerToken("chat", store.id) : undefined,
    });
  } catch (error) {
    return apiError(error);
  }
}
