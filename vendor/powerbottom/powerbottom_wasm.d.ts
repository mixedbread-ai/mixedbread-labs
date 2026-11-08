/* tslint:disable */
/* eslint-disable */

/**
 * A presentation opened from bytes.
 */
export class Presentation {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Number of fonts embedded in the presentation.
     */
    embedded_font_count(): number;
    /**
     * Number of font faces available (supplied + embedded).
     */
    font_count(): number;
    /**
     * Whether slide `index` (0-based) is marked hidden.
     */
    is_hidden(index: number): boolean;
    /**
     * Open a `.pptx` or `.ppt` from its bytes. `fonts` is an array of `Uint8Array`s, each a
     * TTF/OTF/TTC file, used like installed fonts (may be empty: then only the fonts embedded
     * in the deck are available and text in other fonts falls back to whatever face exists).
     * Asian and complex-script characters none of them has (Han, kana, Hangul, Indic, Thai, ...)
     * and emoji are drawn by the browser: `slide_svg` and `render_slide` write them as text,
     * which the browser draws with the viewer's fonts.
     */
    static open(bytes: Uint8Array, fonts: any): Presentation;
    /**
     * Render slide `index` once and return its SVG, a PNG thumbnail at `thumb_scale` pixels
     * per point (0 = no thumbnail) and its plain text.
     */
    render_slide(index: number, thumb_scale: number): SlideRender;
    /**
     * Number of slides (hidden ones included).
     */
    slide_count(): number;
    /**
     * Markdown of one slide (0-based, hidden or not).
     */
    slide_markdown(index: number, opts: any): string;
    /**
     * Slide `index` as PNG at `scale` pixels per point (1.0 = 72 dpi).
     */
    slide_png(index: number, scale: number): Uint8Array;
    /**
     * `[width, height]` of a slide in points.
     */
    slide_size(): Float32Array;
    /**
     * Slide `index` (0-based, hidden or not) as a standalone SVG document with the invisible
     * text layer (selectable/searchable text). Slide-local ids are prefixed with `s<index+1>`,
     * so the SVGs of several slides can be inlined into one HTML document.
     */
    slide_svg(index: number): string;
    /**
     * Plain text of a slide (paragraphs joined by newlines), for search and indexing.
     */
    slide_text(index: number): string;
    /**
     * The deck title (`dc:title` from the core properties), if any.
     */
    title(): string | undefined;
    /**
     * The deck as one self-contained HTML page (inline SVG per slide, viewer, print CSS).
     * `opts`: `{notes, thumbnails, includeHidden, range: [a, b], title, textLayer}`.
     */
    to_html(opts: any): string;
    /**
     * The deck as Markdown (see `docs/markdown.md`). `opts`: `{notes, includeHidden,
     * slideHeadings, fields, html, codeFonts, order: "visual"|"topleft"|"zorder",
     * math: "latex"|"text", range: [a, b]}`.
     */
    to_markdown(opts: any): string;
}

/**
 * One rendered slide or page: the SVG, an optional PNG thumbnail and the plain text.
 */
export class SlideRender {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    png: Uint8Array;
    svg: string;
    text: string;
}

/**
 * A Word document (`.docx`, `.doc`, `.rtf`, `.odt` and their variants) opened from bytes.
 */
export class WordDocument {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Open a Word document from its bytes, laid out into pages. `fonts` as for
     * [`Presentation::open`].
     */
    static open(bytes: Uint8Array, fonts: any): WordDocument;
    /**
     * Number of pages.
     */
    page_count(): number;
    /**
     * Page `index` as PNG at `scale` pixels per point (1.0 = 72 dpi).
     */
    page_png(index: number, scale: number): Uint8Array;
    /**
     * `[width, height]` of page `index` (0-based) in points.
     */
    page_size(index: number): Float32Array;
    /**
     * Page `index` as a standalone SVG document with the invisible text layer; page-local ids
     * are prefixed with `p<index+1>`.
     */
    page_svg(index: number): string;
    /**
     * Plain text of page `index`, one line per text line, in drawing order.
     */
    page_text(index: number): string;
    /**
     * Render page `index` once and return its SVG, a PNG thumbnail at `thumb_scale` pixels per
     * point (0 = no thumbnail) and its plain text.
     */
    render_page(index: number, thumb_scale: number): SlideRender;
    /**
     * The document title (core properties), if any.
     */
    title(): string | undefined;
    /**
     * The document as Markdown (`docs/word-markdown.md`), pictures as alt text.
     */
    to_markdown(): string;
}

/**
 * What `bytes` holds, judged by content: `"word"`, `"presentation"` or `"other"`; `undefined`
 * when the content does not tell (plain text, unknown or damaged files).
 */
export function document_kind(bytes: Uint8Array): string | undefined;

/**
 * Seconds since the Unix epoch used for date fields on slides (`Date.now() / 1000`).
 */
export function set_unix_time(secs: number): void;

export function start(): void;

/**
 * The crate version.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_get_sliderender_png: (a: number) => [number, number];
    readonly __wbg_get_sliderender_svg: (a: number) => [number, number];
    readonly __wbg_get_sliderender_text: (a: number) => [number, number];
    readonly __wbg_presentation_free: (a: number, b: number) => void;
    readonly __wbg_set_sliderender_png: (a: number, b: number, c: number) => void;
    readonly __wbg_set_sliderender_svg: (a: number, b: number, c: number) => void;
    readonly __wbg_set_sliderender_text: (a: number, b: number, c: number) => void;
    readonly __wbg_sliderender_free: (a: number, b: number) => void;
    readonly __wbg_worddocument_free: (a: number, b: number) => void;
    readonly document_kind: (a: number, b: number) => [number, number];
    readonly presentation_embedded_font_count: (a: number) => number;
    readonly presentation_font_count: (a: number) => number;
    readonly presentation_is_hidden: (a: number, b: number) => number;
    readonly presentation_open: (a: number, b: number, c: any) => [number, number, number];
    readonly presentation_render_slide: (a: number, b: number, c: number) => [number, number, number];
    readonly presentation_slide_count: (a: number) => number;
    readonly presentation_slide_markdown: (a: number, b: number, c: any) => [number, number, number, number];
    readonly presentation_slide_png: (a: number, b: number, c: number) => [number, number, number, number];
    readonly presentation_slide_size: (a: number) => [number, number];
    readonly presentation_slide_svg: (a: number, b: number) => [number, number, number, number];
    readonly presentation_slide_text: (a: number, b: number) => [number, number, number, number];
    readonly presentation_title: (a: number) => [number, number];
    readonly presentation_to_html: (a: number, b: any) => [number, number, number, number];
    readonly presentation_to_markdown: (a: number, b: any) => [number, number, number, number];
    readonly set_unix_time: (a: number) => void;
    readonly start: () => void;
    readonly version: () => [number, number];
    readonly worddocument_open: (a: number, b: number, c: any) => [number, number, number];
    readonly worddocument_page_count: (a: number) => number;
    readonly worddocument_page_png: (a: number, b: number, c: number) => [number, number, number, number];
    readonly worddocument_page_size: (a: number, b: number) => [number, number, number, number];
    readonly worddocument_page_svg: (a: number, b: number) => [number, number, number, number];
    readonly worddocument_page_text: (a: number, b: number) => [number, number, number, number];
    readonly worddocument_render_page: (a: number, b: number, c: number) => [number, number, number];
    readonly worddocument_title: (a: number) => [number, number];
    readonly worddocument_to_markdown: (a: number) => [number, number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
