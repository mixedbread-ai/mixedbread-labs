import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { isOwner, ownerToken } from "@/lib/owner";
import { ELEMENT_TYPES, FORMATS, MODES } from "@/lib/parse";

const BodySchema = z.object({
  file_id: z.uuid(),
  /** From the upload, when this browser made the file */
  file_token: z.string().max(100).optional(),
  mode: z.enum(MODES.map(({ value }) => value)),
  return_format: z.enum(FORMATS.map(({ value }) => value)),
  element_types: z.array(z.enum(ELEMENT_TYPES.map(({ type }) => type))).min(1),
});

/**
 * Starts parsing an uploaded file with the options picked. The job's owner
 * token deletes the job, and its file too when the caller proves they
 * uploaded it: parsing again takes any file a link shows, which the new job
 * mustn't be able to delete.
 */
export async function POST(req: Request) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return badRequest("Invalid parsing options.");

  const { file_token, ...options } = body.data;
  const ownsFile = isOwner("file", options.file_id, file_token);
  try {
    const job = await getMixedbreadClient().parsing.jobs.create({
      ...options,
      chunking_strategy: "page",
    });
    return NextResponse.json({
      ...job,
      owner_token: ownerToken(ownsFile ? "parse-file" : "parse", job.id),
    });
  } catch (error) {
    return apiError(error);
  }
}
