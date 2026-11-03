import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import { getMixedbreadClient } from "@/lib/mixedbread";

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
