import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiError,
  badRequest,
  deleted,
  isMissing,
  rejectBots,
} from "@/lib/api";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { isOwner } from "@/lib/owner";
import { OWNER_HEADER } from "@/lib/request";
import { chatFilesOf } from "@/lib/stores";

/** A chat's files and how far indexing them has got, for the page to poll */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ store: string }> }
) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const { store } = await params;
  if (!z.uuid().safeParse(store).success) return badRequest("Invalid chat.");

  try {
    return NextResponse.json(await chatFilesOf(store));
  } catch (error) {
    return apiError(error);
  }
}

/**
 * Deletes a chat for everyone with its link: the files it indexed, then its
 * store, so a delete that fails partway can run again and find the rest.
 * Only the browser that made it holds the token this takes.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ store: string }> }
) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const { store } = await params;
  if (!z.uuid().safeParse(store).success) return badRequest("Invalid chat.");
  if (!isOwner("chat", store, req.headers.get(OWNER_HEADER))) {
    return NextResponse.json(
      { error: "Only the browser that made this chat can delete it." },
      { status: 403 }
    );
  }

  const client = getMixedbreadClient();
  try {
    const files = await chatFilesOf(store);
    await Promise.all(files.map(({ id }) => deleted(client.files.delete(id))));
    await deleted(client.stores.delete(store));
  } catch (error) {
    if (!isMissing(error)) return apiError(error);
  }
  return new Response(null, { status: 204 });
}
