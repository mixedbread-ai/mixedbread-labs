import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
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
