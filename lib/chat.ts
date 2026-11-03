import type { UIMessage } from "ai";

/** Chat's agent, through the Vercel AI Gateway */
export const CHAT_MODEL = "openai/gpt-5.6-terra";
export const CHAT_MODEL_NAME = "GPT-5.6 Terra";

export const CHAT_SUGGESTIONS = [
  "Summarize these documents",
  "What are the key figures?",
  "What should I know before reading them?",
];

/** A passage of a document as search and chat show it: its text, and its page when it has one */
export interface DocPage {
  /** The file it comes from */
  file: string;
  /** Set for chunks that are a page */
  page: number | null;
  /** The passage's text, the runs of marked blocks apart */
  segments: DocSegment[];
  /** The page with the marked blocks boxed, for chunks that are a page image */
  view: DocPageView | null;
}

/** A search result: a passage with the blocks that match the query marked */
export interface DocHit extends DocPage {
  /** `file_id:chunk_index`, the chunk reference the API uses */
  id: string;
  score: number;
}

/** A passage an answer cites, with every block it cites there marked */
export interface DocCitedPage extends DocPage {
  /** The passage's number among the answer's sources, as its citations show it */
  n: number;
}

/** A run of a page's blocks as Markdown, boxed when they match the query */
export interface DocSegment {
  markdown: string;
  marked: boolean;
}

export interface DocSearchResponse {
  hits: DocHit[];
  /** Time the search call took on the server */
  ms: number;
}

/** A search Terra ran */
export interface DocCall {
  status: "in_progress" | "completed" | "failed";
  /** The search query */
  terms: string[];
  hits?: number;
  /** When the call started, in ms since the question was asked */
  at: number;
  ms?: number;
}

/**
 * One citation: the blocks of a passage a sentence stands on. Citations of
 * the same passage share its number, in order of its first citation.
 */
export interface DocSource {
  /** The cited passage and blocks, as `c3.4_7` for blocks 4 and 7 of handle c3 */
  key: string;
  n: number;
  file: string;
  page: number | null;
  /** The cited blocks as plain text */
  preview: string;
  /** The sentence that cites them */
  claim: string;
  /** The page with the cited blocks boxed */
  view: DocPageView | null;
}

/** A page image with boxes over some of its blocks */
export interface DocPageView {
  /** From `pageImage` */
  image: string;
  /** The page's size, in its own pixels */
  width: number;
  height: number;
  marks: DocMark[];
  /** Where the page's text is printed, the margins outside it */
  printed?: DocMark;
}

/** A block of a page, in fractions of the page's width and height */
export interface DocMark {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DocChatMessage = UIMessage<
  unknown,
  {
    call: DocCall;
    source: DocSource;
    page: DocCitedPage;
    /** A line under the answer about how it ended, such as being cut off */
    notice: string;
  }
>;

/** Answers carry their citations inline as Markdown links to this fragment */
export const CITATION_HREF = "#cite-";

export function citation(source: DocSource): string {
  return `[${source.n}](${CITATION_HREF}${source.key})`;
}

/** A page's image, served from this site so its address stays the same across searches */
export function pageImage(
  store: string,
  fileId: string,
  chunkIndex: number
): string {
  return `/api/chats/${store}/pages/${fileId}/${chunkIndex}`;
}

export function pageLabel({
  file,
  page,
}: Pick<DocPage, "file" | "page">): string {
  return page ? `${file} · p. ${page}` : file;
}

/** A file of a chat, and how far indexing it has got */
export interface ChatFile {
  id: string;
  filename: string;
  status: "pending" | "in_progress" | "cancelled" | "completed" | "failed";
}

export function isIndexing(files: ChatFile[]): boolean {
  return files.some(
    ({ status }) => status === "pending" || status === "in_progress"
  );
}
