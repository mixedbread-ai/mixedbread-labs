import type { InferUIMessageChunk } from "ai";
import {
  CHAT_MODEL_NAME,
  citation,
  type DocCall,
  type DocChatMessage,
  type DocCitedPage,
  type DocSource,
} from "@/lib/chat";
import { pageMarkdown } from "@/lib/layout";
import { docPageOf, type Passage, viewOf } from "@/lib/passages";
import { plainText } from "@/lib/text";
import type { SearchOutput } from "./tools";

type Chunk = InferUIMessageChunk<DocChatMessage>;

const SOURCE_PREVIEW_LENGTH = 400;
// How far back from a citation the sentence it stands for may start
const CLAIM_LENGTH = 400;

// Mixedbread's citation grammar, as its Question Answering writes it:
// `<cite i="c3" e="4"/>` cites element 4 of chunk c3's page layout, and
// `<cite i="c3"/>` the chunk as a whole. A run of tags is one citation.
const MARKER = /<cite\b[^>]*\/>(?:\s*<cite\b[^>]*\/>)*/g;
const TAG = /<cite\s+i="([^"]+)"(?:\s+e="(\d+)")?\s*\/>/g;
// What a tag looks like before it has fully streamed in
const OPEN_MARKER = /^<(?:c(?:i(?:t(?:e(?:\s[^>]*)?)?)?)?)?$/;

/** Why Terra ended a run early, for the note under what it wrote */
function stopNotice(reason: string | undefined): string | undefined {
  switch (reason) {
    case "length":
      return "The answer was cut off at its length limit.";
    case "tool-calls":
      return `${CHAT_MODEL_NAME} reached its search limit, so the answer may be incomplete.`;
    default:
      return undefined;
  }
}

/**
 * Terra's tool calls as `data-call` parts, which the chat draws as its
 * activity rows, and a note when the run stopped early. The tool parts
 * themselves stay on the server: they hold every page Terra read.
 */
export function toolCallsAsData(asked: number): TransformStream<Chunk, Chunk> {
  const calls = new Map<string, DocCall>();
  let answered = false;

  function update(
    controller: TransformStreamDefaultController<Chunk>,
    id: string,
    change: Partial<DocCall>
  ) {
    const call = calls.get(id);
    if (!call) return;
    const next = { ...call, ...change };
    if (next.status !== "in_progress") next.ms = Date.now() - asked - next.at;
    calls.set(id, next);
    controller.enqueue({ type: "data-call", id, data: next });
  }

  return new TransformStream({
    transform(chunk, controller) {
      switch (chunk.type) {
        case "tool-input-start":
        case "tool-input-delta":
          return;
        case "tool-input-available": {
          const { query } = (chunk.input ?? {}) as { query?: unknown };
          const call: DocCall = {
            status: "in_progress",
            terms: typeof query === "string" ? [query] : [],
            at: Date.now() - asked,
          };
          calls.set(chunk.toolCallId, call);
          controller.enqueue({
            type: "data-call",
            id: chunk.toolCallId,
            data: call,
          });
          return;
        }
        case "tool-output-available": {
          const { results } = chunk.output as SearchOutput;
          update(controller, chunk.toolCallId, {
            status: "completed",
            hits: results.length,
          });
          return;
        }
        case "tool-input-error":
        case "tool-output-error":
          update(controller, chunk.toolCallId, { status: "failed" });
          return;
        case "text-delta":
          if (chunk.delta.trim()) answered = true;
          break;
        case "finish": {
          const notice = stopNotice(chunk.finishReason);
          if (notice && answered) {
            controller.enqueue({ type: "data-notice", data: notice });
          } else if (notice || !answered) {
            controller.enqueue({
              type: "error",
              errorText: `${CHAT_MODEL_NAME} stopped before answering. Try a narrower question.`,
            });
          }
          break;
        }
      }
      controller.enqueue(chunk);
    },
  });
}

/**
 * Terra's `<cite>` tags as citations: each run of tags becomes a numbered
 * link per passage, and a `data-source` part carries the passage with the
 * cited elements boxed. Every cited passage also gets a `data-page` part, the
 * source the answer lists, with all the elements cited in it marked. A tag
 * naming a chunk Terra was never shown is dropped, as a pointer to nothing.
 */
export function blockCitations(
  store: string,
  shown: Map<string, Passage>
): TransformStream<Chunk, Chunk> {
  const sources = new Map<string, DocSource>();
  const numbers = new Map<string, number>();
  // Every block cited in each passage, for its entry among the sources
  const cited = new Map<string, Set<number>>();
  // Per text part: what streamed in but may be the start of a marker, and
  // the answer so far without its markers, to find what a citation stands for
  const held = new Map<string, string>();
  const written = new Map<string, string[]>();

  function cite(
    controller: TransformStreamDefaultController<Chunk>,
    marker: string,
    claim: string
  ): string {
    // A run of tags may cite several passages: a link for each, in order
    const byHandle = new Map<string, number[]>();
    for (const [, handle = "", element] of marker.matchAll(TAG)) {
      const passage = shown.get(handle);
      if (!passage) continue;
      const blocks = byHandle.get(handle) ?? [];
      const index = element === undefined ? undefined : Number(element);
      if (
        index !== undefined &&
        index < (passage.layout?.elements.length ?? 0) &&
        !blocks.includes(index)
      ) {
        blocks.push(index);
      }
      byHandle.set(handle, blocks);
    }

    let links = "";
    for (const [handle, blocks] of byHandle) {
      const passage = shown.get(handle) as Passage;
      const indices = blocks.toSorted((a, b) => a - b);
      const key =
        indices.length > 0 ? `${handle}.${indices.join("_")}` : handle;
      let source = sources.get(key);
      if (!source) {
        source = toSource(passage, handle, key, indices, claim);
        sources.set(key, source);
        controller.enqueue({ type: "data-source", id: key, data: source });
        const all = cited.get(handle) ?? new Set();
        for (const index of indices) all.add(index);
        cited.set(handle, all);
        controller.enqueue({
          type: "data-page",
          id: handle,
          data: toPage(passage, source.n, all),
        });
      }
      links += citation(source);
    }
    return links;
  }

  function elementsOf(passage: Passage, indices: Iterable<number>) {
    return Array.from(indices)
      .toSorted((a, b) => a - b)
      .flatMap((index) => passage.layout?.elements[index] ?? []);
  }

  function toPage(
    passage: Passage,
    n: number,
    blocks: Set<number>
  ): DocCitedPage {
    return { n, ...docPageOf(store, passage, elementsOf(passage, blocks)) };
  }

  function toSource(
    passage: Passage,
    handle: string,
    key: string,
    indices: number[],
    claim: string
  ): DocSource {
    const n = numbers.get(handle) ?? numbers.size + 1;
    numbers.set(handle, n);
    const elements = elementsOf(passage, indices);
    let text = passage.text;
    if (elements.some((element) => element.text?.trim())) {
      text = elements.map((element) => element.text ?? "").join("\n\n");
    } else if (passage.layout) {
      text = pageMarkdown(passage.layout);
    }
    return {
      key,
      n,
      file: passage.file,
      page: passage.page,
      preview: plainText(text).slice(0, SOURCE_PREVIEW_LENGTH),
      claim,
      view: passage.layout
        ? viewOf(store, passage, passage.layout, elements)
        : null,
    };
  }

  /**
   * The text with its whole citations linked. A tag still streaming in waits,
   * and so does a run of tags at the end, which the next tag may extend;
   * `final` lets everything out.
   */
  function release(
    controller: TransformStreamDefaultController<Chunk>,
    id: string,
    final: boolean
  ) {
    const all = held.get(id) ?? "";
    let cut = all.length;
    if (!final) {
      const open = all.lastIndexOf("<");
      if (open !== -1 && OPEN_MARKER.test(all.slice(open))) cut = open;
      const last = Array.from(all.slice(0, cut).matchAll(MARKER)).at(-1);
      if (last && !all.slice(last.index + last[0].length, cut).trim()) {
        cut = last.index;
      }
    }
    held.set(id, all.slice(cut));
    const text = all.slice(0, cut);

    const so = written.get(id) ?? [];
    let delta = "";
    let from = 0;
    for (const match of text.matchAll(MARKER)) {
      const before = text.slice(from, match.index);
      so.push(...before);
      delta += before + cite(controller, match[0], claimAt(so));
      from = match.index + match[0].length;
    }
    const rest = text.slice(from);
    so.push(...rest);
    written.set(id, so);
    delta += rest;
    if (delta) controller.enqueue({ type: "text-delta", id, delta });
  }

  return new TransformStream({
    transform(chunk, controller) {
      if (chunk.type === "text-delta") {
        held.set(chunk.id, (held.get(chunk.id) ?? "") + chunk.delta);
        release(controller, chunk.id, false);
        return;
      }
      if (chunk.type === "text-end") release(controller, chunk.id, true);
      controller.enqueue(chunk);
    },
  });
}

/**
 * The sentence that ends where a citation stands, in code points so an emoji
 * can't shift it
 */
function claimAt(chars: string[]): string {
  let end = chars.length;
  while (end > 0 && /[\s.!?]/.test(chars[end - 1] ?? "")) end--;
  let start = end;
  while (
    start > 0 &&
    start > end - CLAIM_LENGTH &&
    !endsSentence(chars, start)
  ) {
    start--;
  }
  return chars.slice(start, end).join("").replace(/\*\*/g, "").trim();
}

// A full stop ends a sentence only before a space, so "$16.3 billion" stays whole
function endsSentence(chars: string[], at: number): boolean {
  const before = chars[at - 1] ?? "";
  return (
    /[!?\n]/.test(before) || (before === "." && /\s/.test(chars[at] ?? ""))
  );
}
