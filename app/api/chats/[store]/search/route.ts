import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, badRequest, rejectBots } from "@/lib/api";
import type { DocHit, DocSearchResponse } from "@/lib/chat";
import { evidenceFor } from "@/lib/layout";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { docPageOf, passageOf } from "@/lib/passages";

const QuerySchema = z.string().trim().min(1).max(1000);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ store: string }> }
) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const { store } = await params;
  const query = QuerySchema.safeParse(
    new URL(req.url).searchParams.get("query")
  );
  if (!z.uuid().safeParse(store).success || !query.success) {
    return badRequest("Invalid query.");
  }

  // vercel.json runs this next to the API (us-east-1), so the time shown is
  // the search's own
  const started = performance.now();
  try {
    const { data } = await getMixedbreadClient().stores.search({
      query: query.data,
      store_identifiers: [store],
      top_k: 8,
    });
    const hits: DocHit[] = [];
    for (const chunk of data) {
      const passage = passageOf(chunk);
      if (!passage.layout && !passage.text) continue;
      // A page's layout keeps its headings, lists and tables apart, and
      // places the blocks the query's words are in
      const evidence = passage.layout
        ? evidenceFor(query.data, passage.layout)
        : [];
      hits.push({
        id: `${chunk.file_id}:${chunk.chunk_index}`,
        score: chunk.score,
        ...docPageOf(store, passage, evidence),
      });
    }
    return NextResponse.json<DocSearchResponse>({
      hits,
      ms: Math.round(performance.now() - started),
    });
  } catch (error) {
    return apiError(error);
  }
}
