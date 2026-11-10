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

/** A job's status, for the page to poll while it runs; the page loads the result itself */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ job: string }> }
) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const { job } = await params;
  if (!z.uuid().safeParse(job).success) return badRequest("Invalid job.");

  try {
    const { status } = await getMixedbreadClient().parsing.jobs.retrieve(job);
    return NextResponse.json({ status });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * Deletes a parse for everyone with its link, and first the file it read when
 * its token says this browser uploaded that file, so a delete that fails
 * partway can run again. Only the browser that started it holds the token.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ job: string }> }
) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const { job } = await params;
  if (!z.uuid().safeParse(job).success) return badRequest("Invalid job.");
  const token = req.headers.get(OWNER_HEADER);
  const withFile = isOwner("parse-file", job, token);
  if (!withFile && !isOwner("parse", job, token)) {
    return NextResponse.json(
      { error: "Only the browser that started this parse can delete it." },
      { status: 403 }
    );
  }

  const client = getMixedbreadClient();
  try {
    const { file_id } = await client.parsing.jobs.retrieve(job);
    if (withFile) await deleted(client.files.delete(file_id));
    await deleted(client.parsing.jobs.delete(job));
  } catch (error) {
    if (!isMissing(error)) return apiError(error);
  }
  return new Response(null, { status: 204 });
}
