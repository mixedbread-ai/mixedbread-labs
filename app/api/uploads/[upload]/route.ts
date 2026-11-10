import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import type { UploadedFile } from "@/lib/files";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { ownerToken } from "@/lib/owner";

const BodySchema = z.object({
  parts: z
    .array(
      z.object({
        part_number: z.number().int().positive(),
        etag: z.string().min(1).max(200),
      })
    )
    .min(1)
    .max(10_000),
});

/** Finishes an upload once the browser has sent every part, making it a file */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ upload: string }> }
) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const { upload } = await params;
  const body = BodySchema.safeParse(await req.json());
  if (!z.uuid().safeParse(upload).success || !body.success) {
    return badRequest("Invalid upload.");
  }

  try {
    const file = await getMixedbreadClient().files.uploads.complete(
      upload,
      body.data
    );
    return NextResponse.json<UploadedFile>({
      id: file.id,
      filename: file.filename,
      token: ownerToken("file", file.id),
    });
  } catch (error) {
    return apiError(error);
  }
}
