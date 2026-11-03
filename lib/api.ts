import { APIError } from "@mixedbread/sdk";
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Every route the page calls spends the Labs key, so each turns bots away
 * first. Files and page images can't be checked: the PDF viewer and image
 * tags load them without BotID's headers. The check level must match
 * `instrumentation-client.ts` or verification fails.
 */
export async function rejectBots(): Promise<NextResponse | null> {
  const { isBot } = await checkBotId({
    advancedOptions: { checkLevel: "basic" },
  });
  return isBot
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null;
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}

const ApiBodySchema = z.object({ message: z.string() });

/**
 * A failed API call as a response: the API's own message for what it refused,
 * such as an unsupported file, and a plain one for anything else
 */
export function apiError(error: unknown): NextResponse {
  if (error instanceof APIError && error.status && error.status < 500) {
    const body = ApiBodySchema.safeParse(error.error);
    return NextResponse.json(
      { error: body.data?.message ?? error.message },
      { status: error.status }
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong. Try again." },
    { status: 502 }
  );
}
