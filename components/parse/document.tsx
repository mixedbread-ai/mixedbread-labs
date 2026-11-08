"use client";

import { Toggle } from "@base-ui/react/toggle";
import type { ElementType } from "@mixedbread/sdk/resources/parsing/jobs";
import { cn } from "cn";
import { ChevronDownIcon, ChevronUpIcon, SquareDashedIcon } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { type CSSProperties, memo, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { GHOST_ICON } from "@/components/controls";
import { scrollToView } from "@/lib/motion";
import {
  type ParsedElement,
  type ParsedPage,
  typeColor,
  typeOf,
} from "@/lib/parse";
import { elementAt, linkTwins } from "./twins";

// Set here, beside the components, so react-pdf's default can't overwrite it
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDF_OPTIONS = {
  cMapUrl: "/pdfjs/cmaps/",
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  wasmUrl: "/pdfjs/wasm/",
};

const MAX_WIDTH = 820;

/** Who draws the pages: PDF.js, the image itself, the server, or no one */
export type PageKind = "pdf" | "image" | "drawn" | "none";

export interface Selection {
  selected: string | null;
  hidden: readonly ElementType[];
  onSelect: (id: string, from: "page" | "inspector") => void;
}

/**
 * The document's pages, each with its elements boxed over it, and floating
 * controls to move between pages. Pages and boxes show at once; a PDF draws
 * into them as it arrives, an image is its own page, and the server draws the
 * rest as images: Word and PowerPoint pages, SVG and HEIC.
 */
export default function DocumentPages({
  fileId,
  file,
  kind,
  pages,
  selection,
}: {
  fileId: string;
  /** Its address, or the uploader's own copy, which needs no download */
  file: string | File;
  kind: PageKind;
  pages: ParsedPage[];
  selection: Selection;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const width = useWidth(column);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(1);
  const [boxes, setBoxes] = useState(true);
  const blank = kind === "none" || failed;
  const image = useAddress(file);

  function go(page: number) {
    scrollToView(document.getElementById(`page-${page}`), "start");
  }

  // The page under the top third of the view, read once a frame at most
  const frame = useRef(0);
  function track() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = scroller.current;
      if (!element) return;
      const line =
        element.getBoundingClientRect().top + element.clientHeight / 3;
      let page = 1;
      for (const sheet of element.querySelectorAll<HTMLElement>(
        "[data-page]"
      )) {
        if (sheet.getBoundingClientRect().top > line) break;
        page = Number(sheet.dataset.page);
      }
      setCurrent(page);
    });
  }

  return (
    <div className="relative h-full min-h-0">
      {/* Without suspense, so nothing waits on the file but the drawing */}
      {kind === "pdf" && (
        <Document
          suspense={false}
          file={file}
          options={PDF_OPTIONS}
          onLoadSuccess={setPdf}
          onLoadError={() => setFailed(true)}
          loading={null}
          error={null}
          className="hidden"
        />
      )}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: the element list is the keyboard path to every box */}
      <div
        ref={scroller}
        onScroll={track}
        onClick={(e) => {
          const id = elementAt(e.target);
          if (id) selection.onSelect(id, "page");
        }}
        className="h-full overflow-y-auto overscroll-contain px-4 pt-6 pb-20 sm:px-10"
      >
        <div
          ref={column}
          className="mx-auto flex flex-col gap-5"
          style={{ maxWidth: MAX_WIDTH }}
        >
          {blank && (
            <p className="text-center text-xs text-muted-foreground">
              {failed
                ? "The pages couldn't be drawn, so the boxes show on blank pages."
                : "This file type has no preview, so the boxes show on blank pages."}
            </p>
          )}
          <div ref={linkTwins} className="flex flex-col gap-5">
            {pages.map((page) => (
              <Sheet
                key={page.number}
                page={page}
                width={width}
                root={scroller}
                pdf={blank ? null : pdf}
                image={
                  kind === "drawn"
                    ? `/api/files/${fileId}/pages/${page.number}`
                    : kind === "image" && page.number === 1
                      ? image
                      : undefined
                }
                waiting={!blank && kind === "pdf" && !pdf}
                boxes={boxes}
                selected={selection.selected}
                hidden={selection.hidden}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floats over the pages, as a viewer's controls do */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-popover p-1 shadow-float ring-1 ring-soft">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => go(current - 1)}
          className={cn(GHOST_ICON, "size-7 rounded-full")}
        >
          <ChevronUpIcon className="size-4" />
          <span className="sr-only">Previous page</span>
        </button>
        <span className="min-w-14 text-center text-xs text-muted-foreground tabular-nums">
          <span className="text-foreground">{current}</span> / {pages.length}
        </span>
        <button
          type="button"
          disabled={current >= pages.length}
          onClick={() => go(current + 1)}
          className={cn(GHOST_ICON, "size-7 rounded-full")}
        >
          <ChevronDownIcon className="size-4" />
          <span className="sr-only">Next page</span>
        </button>
        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-soft" />
        <Toggle
          pressed={boxes}
          onPressedChange={setBoxes}
          aria-label="Show boxes"
          className={cn(GHOST_ICON, "size-7 rounded-full data-pressed:bg-soft")}
        >
          <SquareDashedIcon className="size-4" />
        </Toggle>
      </div>
    </div>
  );
}

/** An address for the file: its own, or one in this tab for the uploader's copy */
function useAddress(file: string | File): string | undefined {
  const [address, setAddress] = useState<string>();
  useEffect(() => {
    if (typeof file === "string") return setAddress(file);
    const url = URL.createObjectURL(file);
    setAddress(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return address;
}

/** The width of what `ref` holds: the pages' column */
function useWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/**
 * Whether a page holds a drawn canvas: from when it comes within two screens
 * of the view until it is three away. Scrolling back a little finds it still
 * drawn, while a long document holds only the few canvases around the view.
 */
function useNear(
  ref: React.RefObject<HTMLElement | null>,
  root: React.RefObject<HTMLElement | null>
): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const enter = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && setNear(true),
      { root: root.current, rootMargin: "200% 0px" }
    );
    const leave = new IntersectionObserver(
      ([entry]) => entry && !entry.isIntersecting && setNear(false),
      { root: root.current, rootMargin: "300% 0px" }
    );
    enter.observe(element);
    leave.observe(element);
    return () => {
      enter.disconnect();
      leave.disconnect();
    };
  }, [ref, root]);
  return near;
}

// Sharper than this costs canvas memory a phone's 3x screen can't show
const MAX_PIXEL_RATIO = 2;

const Sheet = memo(function Sheet({
  page,
  width,
  root,
  pdf,
  image,
  waiting,
  boxes,
  selected,
  hidden,
}: {
  page: ParsedPage;
  width: number;
  root: React.RefObject<HTMLDivElement | null>;
  pdf: PDFDocumentProxy | null;
  image?: string;
  /** The PDF is still on its way */
  waiting: boolean;
  boxes: boolean;
  selected: string | null;
  hidden: readonly ElementType[];
}) {
  const ref = useRef<HTMLElement>(null);
  const near = useNear(ref, root);
  const [drawn, setDrawn] = useState(false);
  const [broken, setBroken] = useState(false);
  // A canvas or image let go is drawn again when the page comes back
  if (drawn && (pdf || image) && !near) setDrawn(false);

  return (
    <section
      ref={ref}
      id={`page-${page.number}`}
      data-page={page.number}
      aria-label={`Page ${page.number}`}
      style={{ aspectRatio: `${page.width} / ${page.height}` }}
      className={cn(
        "relative w-full scroll-mt-4 rounded-[3px] bg-white shadow-raised ring-1 ring-black/5",
        (waiting || ((pdf || image) && !drawn && !broken)) &&
          "motion-safe:animate-pulse"
      )}
    >
      {near && width > 0 && pdf && (
        // Suspending would tear down every other page's canvas as it loads
        <Page
          suspense={false}
          pdf={pdf}
          pageNumber={page.number}
          width={width}
          devicePixelRatio={Math.min(devicePixelRatio, MAX_PIXEL_RATIO)}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={null}
          onRenderSuccess={() => setDrawn(true)}
          className="absolute! inset-0 overflow-hidden rounded-[3px] [&_canvas]:h-full! [&_canvas]:w-full!"
        />
      )}
      {image && near && !broken && (
        <img
          src={image}
          alt=""
          onLoad={() => setDrawn(true)}
          onError={() => setBroken(true)}
          className="absolute inset-0 size-full rounded-[3px]"
        />
      )}
      {boxes &&
        page.elements.map((element) =>
          hidden.includes(element.type) ? null : (
            <Box
              key={element.id}
              element={element}
              selected={selected === element.id}
            />
          )
        )}
    </section>
  );
});

/** An element's box; hovering lights it, its row and its text, clicking selects it */
const Box = memo(function Box({
  element,
  selected,
}: {
  element: ParsedElement;
  selected: boolean;
}) {
  const [left, top, width, height] = element.box;
  const style = {
    left: `${left * 100}%`,
    top: `${top * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
    "--c": typeColor(element.type),
  } as CSSProperties;

  return (
    <div
      id={`box-${element.id}`}
      data-element={element.id}
      data-twin={`row-${element.id} text-${element.id}`}
      data-selected={selected || undefined}
      style={style}
      className="group absolute cursor-pointer scroll-my-24 rounded-[2px] bg-(--c)/5 outline-1 outline-(--c)/45 transition-[background-color,outline-color] duration-150 hover:bg-(--c)/12 hover:outline-(--c) data-linked:bg-(--c)/14 data-linked:outline-(--c) data-selected:z-10 data-selected:bg-(--c)/14 data-selected:outline-2 data-selected:outline-offset-1 data-selected:outline-(--c)"
    >
      <span className="pointer-events-none absolute bottom-full left-[-1px] mb-0.5 hidden rounded-[3px] bg-(--c) px-1 py-px text-[10px] leading-tight font-medium whitespace-nowrap text-white group-hover:block group-data-linked:block group-data-selected:block">
        {typeOf(element.type).label}
      </span>
    </div>
  );
});
