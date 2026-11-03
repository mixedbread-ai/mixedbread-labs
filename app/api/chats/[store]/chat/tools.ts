import { tool } from "ai";
import { z } from "zod";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { type Passage, passageOf } from "@/lib/passages";

const TOP_K = 8;

/** The tool result: short stable handles, and a chunk seen earlier in the run as a stub */
export interface SearchOutput {
  query: string;
  candidate_count: number;
  results: (
    | {
        chunk_id: string;
        file: string;
        page?: number;
        score: number;
        // A page's layout as the store parsed it: `e` is the element's index,
        // which a citation names to box it
        elements?: { e: number; type: string; text?: string }[];
        text?: string;
      }
    | { chunk_id: string; seen: true }
  )[];
}

/**
 * Search over the chat's store: Toast 1, Mixedbread's search agent, through
 * agentic search. Every chunk it returns is put in `shown` under the handle
 * Terra cites it by.
 */
export function storeTools(store: string, shown: Map<string, Passage>) {
  // Handles by chunk, so a chunk keeps its handle across searches
  const handles = new Map<string, string>();

  return {
    search: tool({
      description:
        "Searches the uploaded documents with Toast 1, Mixedbread's search agent: it runs several searches for the question and returns the most relevant passages, ranked. Phrase the query as a full question. A passage that is a page comes with its layout elements; a passage already returned comes back as a stub.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("The question to find evidence for, in plain words"),
      }),
      execute: async ({ query }): Promise<SearchOutput> => {
        const { data } = await getMixedbreadClient().stores.search({
          query,
          store_identifiers: [store],
          top_k: TOP_K,
          search_options: { agentic: true },
        });
        const results: SearchOutput["results"] = [];
        for (const chunk of data) {
          const passage = passageOf(chunk);
          if (!passage.layout && !passage.text) continue;
          const key = `${passage.fileId}:${passage.chunkIndex}`;
          const known = handles.get(key);
          if (known) {
            results.push({ chunk_id: known, seen: true });
            continue;
          }
          const handle = `c${handles.size + 1}`;
          handles.set(key, handle);
          shown.set(handle, passage);
          results.push({
            chunk_id: handle,
            file: passage.file,
            page: passage.page ?? undefined,
            score: Math.round(chunk.score * 1e4) / 1e4,
            ...(passage.layout
              ? {
                  elements: passage.layout.elements.map(({ type, text }, e) =>
                    text ? { e, type, text } : { e, type }
                  ),
                }
              : { text: passage.text }),
          });
        }
        return { query, candidate_count: results.length, results };
      },
    }),
  };
}
