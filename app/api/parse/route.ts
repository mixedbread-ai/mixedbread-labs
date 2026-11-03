import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { ELEMENT_TYPES, FORMATS, MODES } from "@/lib/parse";

const BodySchema = z.object({
  file_id: z.uuid(),
  mode: z.enum(MODES.map(({ value }) => value)),
  return_format: z.enum(FORMATS.map(({ value }) => value)),
  element_types: z.array(z.enum(ELEMENT_TYPES.map(({ type }) => type))).min(1),
});

/** Starts parsing an uploaded file with the options picked */
export async function POST(req: Request) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return badRequest("Invalid parsing options.");

  try {
    const job = await getMixedbreadClient().parsing.jobs.create({
      ...body.data,
      chunking_strategy: "page",
    });
    return NextResponse.json(job);
  } catch (error) {
    return apiError(error);
  }
}
