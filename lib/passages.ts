import type { StoreSearchResponse } from "@mixedbread/sdk/resources/stores";
import { type DocPage, type DocPageView, pageImage } from "./chat";
import {
  type Layout,
  layoutOf,
  markOf,
  pageSegments,
  printedArea,
} from "./layout";

export type StoreChunk = StoreSearchResponse.Data;

/** What a chunk holds that search and chat read: its page layout, or its text */
export interface Passage {
  file: string;
  fileId: string;
  chunkIndex: number;
  page: number | null;
  layout: Layout | null;
  text: string;
}

export function passageOf(chunk: StoreChunk): Passage {
  const layout =
    chunk.type === "image_url" ? layoutOf(chunk.generated_metadata) : null;
  let text = "";
  if (chunk.type === "text") text = chunk.text ?? "";
  else if (chunk.type === "image_url") text = chunk.ocr_text ?? "";
  return {
    file: chunk.filename,
    fileId: chunk.file_id,
    chunkIndex: chunk.chunk_index,
    // Visual parsing makes a chunk of each page
    page: layout ? chunk.chunk_index + 1 : null,
    layout,
    text,
  };
}

type Element = Layout["elements"][number];

/** A passage as the UI shows it, with `marked` blocks boxed and highlighted */
export function docPageOf(
  store: string,
  passage: Passage,
  marked: Element[]
): DocPage {
  const { layout } = passage;
  return {
    file: passage.file,
    page: passage.page,
    segments: layout
      ? pageSegments(layout, marked)
      : [{ markdown: passage.text, marked: false }],
    view: layout ? viewOf(store, passage, layout, marked) : null,
  };
}

export function viewOf(
  store: string,
  { fileId, chunkIndex }: Passage,
  layout: Layout,
  marked: Element[]
): DocPageView {
  return {
    image: pageImage(store, fileId, chunkIndex),
    width: layout.width,
    height: layout.height,
    marks: marked.map((element) => markOf(element, layout)),
    printed: printedArea(layout),
  };
}
