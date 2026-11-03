import { z } from "zod";
import type { DocMark, DocSegment } from "@/lib/chat";

// Visual parsing places each block of a page in the page's own pixels. The SDK
// types generated_metadata loosely, so the layout is read through this.
const LayoutSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  elements: z.array(
    z.object({
      type: z.string(),
      bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      text: z.string().nullish(),
    })
  ),
});

export type Layout = z.infer<typeof LayoutSchema>;
type Element = Layout["elements"][number];

export function layoutOf(generatedMetadata: unknown): Layout | null {
  const metadata = z
    .object({ layout: LayoutSchema })
    .safeParse(generatedMetadata);
  return metadata.success ? metadata.data.layout : null;
}

/** What the page says, not the furniture around it */
function isContent({ type, text }: Element): boolean {
  return (
    type !== "footer" &&
    type !== "header" &&
    type !== "page-number" &&
    !!text?.trim()
  );
}

/** A page as Markdown, a block per element: headings, lists and tables as they're laid out */
export function pageMarkdown(layout: Layout): string {
  return markdownOf(layout.elements);
}

/** The page's Markdown cut where it goes in and out of the marked blocks */
export function pageSegments(layout: Layout, marked: Element[]): DocSegment[] {
  const segments: DocSegment[] = [];
  let run: Element[] = [];
  let inMarked = false;
  for (const element of layout.elements.filter(isContent)) {
    const isMarked = marked.includes(element);
    if (run.length > 0 && isMarked !== inMarked) {
      segments.push({ markdown: markdownOf(run), marked: inMarked });
      run = [];
    }
    run.push(element);
    inMarked = isMarked;
  }
  if (run.length > 0) {
    segments.push({ markdown: markdownOf(run), marked: inMarked });
  }
  return segments;
}

function markdownOf(elements: Element[]): string {
  let markdown = "";
  let listing = false;
  for (const element of elements) {
    if (!isContent(element)) continue;
    const text = element.text?.trim() ?? "";
    const item = element.type === "list-item";
    if (markdown) markdown += item && listing ? "\n" : "\n\n";
    if (element.type === "section-header") markdown += `### ${text}`;
    else if (item) markdown += `- ${text.replace(/^•\s*/, "")}`;
    else markdown += text;
    listing = item;
  }
  return markdown;
}

// Numbers keep their separators, so "16,286" finds the table it came from;
// other words count from four letters, which skips most filler
const TERMS = /\p{N}[\p{N}.,]*\p{N}|\p{L}{4,}/gu;

const YEAR = /^(?:19|20)\d\d$/;

function termsOf(text: string): Set<string> {
  const terms = new Set<string>();
  const words = text.replace(/<[^>]*>/g, " ").toLowerCase();
  for (const [term] of words.matchAll(TERMS)) terms.add(term);
  return terms;
}

/** A figure, unlike a year or a day of the month, ties a claim to one block */
function isFigure(term: string): boolean {
  return (
    /\d/.test(term) &&
    (/[.,]/.test(term) || (term.length > 2 && !YEAR.test(term)))
  );
}

/**
 * The blocks a claim stands on, found as Mixedbread Chat finds them: every
 * block that shares half the claim's terms, or else the closest one if it
 * shares a quarter. On a page that holds one of the claim's figures, only the
 * blocks holding one count.
 */
export function evidenceFor(claim: string, layout: Layout): Element[] {
  const terms = termsOf(claim);
  const blocks = layout.elements
    .filter(isContent)
    .map((element) => ({ element, found: termsOf(element.text ?? "") }));
  const figures = Array.from(terms).filter(
    (term) => isFigure(term) && blocks.some(({ found }) => found.has(term))
  );
  const marked: Element[] = [];
  let best: Element | undefined;
  let most = 0;
  for (const { element, found } of blocks) {
    if (figures.length > 0 && !figures.some((figure) => found.has(figure))) {
      continue;
    }
    let shared = 0;
    for (const term of terms) if (found.has(term)) shared++;
    if (shared > 1 && shared >= terms.size / 2) marked.push(element);
    if (shared > most) {
      best = element;
      most = shared;
    }
  }
  if (marked.length === 0 && best && most > 1 && most >= terms.size / 4) {
    marked.push(best);
  }
  return marked;
}

/** The box around everything printed on the page, its furniture aside */
export function printedArea(layout: Layout): DocMark | undefined {
  const content = layout.elements.filter(isContent);
  if (content.length === 0) return undefined;
  const left = Math.min(...content.map(({ bbox }) => bbox[0]));
  const top = Math.min(...content.map(({ bbox }) => bbox[1]));
  const right = Math.max(...content.map(({ bbox }) => bbox[2]));
  const bottom = Math.max(...content.map(({ bbox }) => bbox[3]));
  return markOf({ type: "text", bbox: [left, top, right, bottom] }, layout);
}

export function markOf(element: Element, layout: Layout): DocMark {
  const [left, top, right, bottom] = element.bbox;
  return {
    x: left / layout.width,
    y: top / layout.height,
    width: (right - left) / layout.width,
    height: (bottom - top) / layout.height,
  };
}
