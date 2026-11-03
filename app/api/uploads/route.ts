import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import { MAX_FILE_BYTES, PART_BYTES, type UploadStart } from "@/lib/files";
import { getMixedbreadClient } from "@/lib/mixedbread";

const BodySchema = z.object({
  filename: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
  type: z.string().max(255),
});

/**
 * Starts an upload: the browser sends the file's parts straight to storage
 * through the links this returns, so no file passes through this server
 */
export async function POST(req: Request) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return badRequest("That file is too large or invalid.");

  const { filename, size, type } = body.data;
  try {
    const upload = await getMixedbreadClient().files.uploads.create({
      filename,
      file_size: size,
      mime_type: type || "application/octet-stream",
      part_count: Math.ceil(size / PART_BYTES),
    });
    return NextResponse.json<UploadStart>({
      id: upload.id,
      parts: upload.part_urls,
    });
  } catch (error) {
    return apiError(error);
  }
}
