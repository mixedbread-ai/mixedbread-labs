import type { ParsingJob } from "@mixedbread/sdk/resources/parsing/jobs";
import { remember } from "./history";
import { jobHref, MODES, type ParseOptions } from "./parse";
import { postJson } from "./request";

// The jobs this tab started, so their page can show them queued while it
// loads rather than a result that isn't there yet
const started = new Map<string, ParsingJob>();

export function startedJob(id: string): ParsingJob | undefined {
  return started.get(id);
}

/**
 * Starts parsing an uploaded file, resolving to the result's link. With the
 * upload's token, deleting the parse deletes the file too.
 */
export async function startParse(
  fileId: string,
  options: ParseOptions,
  fileToken?: string
): Promise<string> {
  const job = await postJson<ParsingJob & { owner_token?: string }>(
    "/api/parse",
    { file_id: fileId, file_token: fileToken, ...options }
  );
  started.set(job.id, job);
  const href = jobHref(job.id, options.mode);
  // Listed now with the token that deletes it; the result names it fully
  if (job.owner_token) {
    remember({
      kind: "parse",
      href,
      title: job.filename ?? "Parse",
      detail: MODES.find(({ value }) => value === options.mode)?.label ?? "",
      token: job.owner_token,
    });
  }
  return href;
}
