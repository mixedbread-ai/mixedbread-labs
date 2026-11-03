import type {
  DocumentParserResult,
  ElementType,
  ParsingJob,
  ReturnFormat,
} from "@mixedbread/sdk/resources/parsing/jobs";
import { postJson } from "./request";
import { plainText } from "./text";

export type ParseMode = "fast" | "high_quality";

export interface ParseOptions {
  mode: ParseMode;
  return_format: ReturnFormat;
  element_types: ElementType[];
}

export const MODES: { value: ParseMode; label: string }[] = [
  { value: "high_quality", label: "High quality" },
  { value: "fast", label: "Fast" },
];

export const FORMATS: { value: ReturnFormat; label: string }[] = [
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "plain", label: "Plain" },
];

/** Each type's name and the hue its boxes take; page furniture stays grey */
export const ELEMENT_TYPES: {
  type: ElementType;
  label: string;
  hue: number;
  chroma: number;
}[] = [
  { type: "title", label: "Title", hue: 39, chroma: 0.19 },
  { type: "section-header", label: "Section header", hue: 10, chroma: 0.17 },
  { type: "text", label: "Text", hue: 250, chroma: 0.14 },
  { type: "list-item", label: "List item", hue: 200, chroma: 0.12 },
  { type: "table", label: "Table", hue: 150, chroma: 0.15 },
  { type: "figure", label: "Figure", hue: 300, chroma: 0.16 },
  { type: "form", label: "Form", hue: 85, chroma: 0.15 },
  { type: "footnote", label: "Footnote", hue: 60, chroma: 0.1 },
  { type: "header", label: "Header", hue: 0, chroma: 0 },
  { type: "footer", label: "Footer", hue: 0, chroma: 0 },
  { type: "page-number", label: "Page number", hue: 0, chroma: 0 },
];

export const DEFAULT_OPTIONS: ParseOptions = {
  mode: "high_quality",
  return_format: "markdown",
  element_types: ELEMENT_TYPES.map(({ type }) => type),
};

export function typeOf(type: ElementType) {
  return (
    ELEMENT_TYPES.find((entry) => entry.type === type) ?? {
      type,
      label: type,
      hue: 0,
      chroma: 0,
    }
  );
}

/** The CSS color of a type, at the lightness the theme asks of it */
export function typeColor(type: ElementType): string {
  const { hue, chroma } = typeOf(type);
  return `oklch(var(--type-l) ${chroma} ${hue})`;
}

/** A job's link, carrying the mode it ran in, which the API doesn't return */
export function jobHref(id: string, mode: ParseMode): string {
  return `/parse/${id}?mode=${mode}`;
}

export function isRunning(status: ParsingJob["status"]): boolean {
  return status === "pending" || status === "in_progress";
}

/** An element as the view tracks it, with an id that names its page and place */
export interface ParsedElement {
  id: string;
  type: ElementType;
  confidence: number;
  /** Fractions of the page: left, top, width, height */
  box: [number, number, number, number];
  /** Corners in the page's own pixels, as the API gives them */
  bbox: [number, number, number, number];
  /** The content as one plain line */
  preview: string;
  page: number;
  content: string;
  summary?: string | null;
  image?: string | null;
}

export interface ParsedPage {
  number: number;
  width: number;
  height: number;
  elements: ParsedElement[];
}

/** The result's elements by page, each placed in fractions of its page */
export function pagesOf(result: DocumentParserResult): ParsedPage[] {
  const pages: ParsedPage[] = (result.page_sizes ?? []).map((size, index) => ({
    number: index + 1,
    width: Number(size[0]) || 1,
    height: Number(size[1]) || 1,
    elements: [],
  }));
  for (const chunk of result.chunks) {
    for (const element of chunk.elements) {
      let page = pages[element.page - 1];
      if (!page) {
        page = { number: element.page, width: 1, height: 1, elements: [] };
        pages[element.page - 1] = page;
      }
      const [left = 0, top = 0, right = 0, bottom = 0] =
        element.bbox.map(Number);
      page.elements.push({
        id: `${element.page}-${page.elements.length}`,
        type: element.type,
        confidence: element.confidence,
        box: [
          left / page.width,
          top / page.height,
          (right - left) / page.width,
          (bottom - top) / page.height,
        ],
        bbox: [left, top, right, bottom],
        page: element.page,
        preview:
          plainText(withoutMath(element.content)) || element.summary || "",
        content: element.content,
        summary: element.summary,
        image: element.image,
      });
    }
  }
  return pages.filter(Boolean);
}

/** Inline math as the letters it shows, for one-line previews: `$\mathcal{X}$` reads `X` */
function withoutMath(text: string): string {
  return text
    .replace(/\\[a-zA-Z]+\{([^{}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[$^_{}]/g, "");
}

/** Starts parsing an uploaded file, resolving to the result's link */
export async function startParse(
  fileId: string,
  options: ParseOptions
): Promise<string> {
  const job = await postJson<{ id: string }>("/api/parse", {
    file_id: fileId,
    ...options,
  });
  return jobHref(job.id, options.mode);
}
