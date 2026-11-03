"use client";

import type { ElementType } from "@mixedbread/sdk/resources/parsing/jobs";
import { cn } from "cn";
import { type CSSProperties, memo, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  type ParsedElement,
  type ParsedPage,
  typeColor,
  typeOf,
} from "@/lib/parse";

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

export interface Highlight {
  hovered: string | null;
  selected: string | null;
  hidden: readonly ElementType[];
  onHover: (id: string | null) => void;
  onSelect: (id: string, from: "page" | "list") => void;
}

/**
 * The document's pages, each with its elements boxed over it. A PDF draws its
 * pages, an image is its own page, and anything else shows its layout on
 * blank sheets.
 */
export default function DocumentPages({
  fileUrl,
  kind,
  pages,
  highlight,
}: {
  fileUrl: string;
  kind: "pdf" | "image" | "none";
  pages: ParsedPage[];
  highlight: Highlight;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const width = useWidth(column);
  const [failed, setFailed] = useState(false);

  const sheets = pages.map((page) => (
    <Sheet
      key={page.number}
      page={page}
      width={width}
      root={scroller}
      highlight={highlight}
      render={
        failed
          ? "none"
          : kind === "pdf"
            ? "pdf"
            : kind === "image" && page.number === 1
              ? "image"
              : "none"
      }
      fileUrl={fileUrl}
    />
  ));

  return (
    <div
      ref={scroller}
      className="h-full overflow-y-auto overscroll-contain px-4 py-5 sm:px-8"
    >
      <div
        ref={column}
        className="mx-auto flex flex-col gap-6"
        style={{ maxWidth: MAX_WIDTH }}
      >
        {(kind === "none" || failed) && (
          <p className="text-center text-xs text-muted-foreground">
            {failed
              ? "The pages couldn't be drawn, so the boxes show on blank pages."
              : "This file type has no preview, so the boxes show on blank pages."}
          </p>
        )}
        {kind === "pdf" && !failed ? (
          <Document
            file={fileUrl}
            options={PDF_OPTIONS}
            onLoadError={() => setFailed(true)}
            loading={null}
            error={null}
            className="flex flex-col gap-6"
          >
            {sheets}
          </Document>
        ) : (
          sheets
        )}
      </div>
    </div>
  );
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
 * Whether an element is within a screen of the view. Pages draw only then:
 * a hundred drawn pages would hold over a gigabyte of canvas.
 */
function useNear(
  ref: React.RefObject<HTMLElement | null>,
  root: React.RefObject<HTMLElement | null>
): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry?.isIntersecting ?? false),
      { root: root.current, rootMargin: "100% 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, root]);
  return near;
}

const Sheet = memo(function Sheet({
  page,
  width,
  root,
  render,
  fileUrl,
  highlight,
}: {
  page: ParsedPage;
  width: number;
  root: React.RefObject<HTMLDivElement | null>;
  render: "pdf" | "image" | "none";
  fileUrl: string;
  highlight: Highlight;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNear(ref, root);
  const [drawn, setDrawn] = useState(false);

  return (
    <section aria-label={`Page ${page.number}`} className="flex flex-col gap-2">
      <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
        {page.number}
      </p>
      <div
        ref={ref}
        id={`page-${page.number}`}
        style={{ aspectRatio: `${page.width} / ${page.height}` }}
        className={cn(
          "relative w-full rounded-sm bg-white shadow-raised ring-1 ring-soft",
          render !== "none" && !drawn && "motion-safe:animate-pulse"
        )}
      >
        {near && width > 0 && render === "pdf" && (
          <Page
            pageNumber={page.number}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={null}
            onRenderSuccess={() => setDrawn(true)}
            className="absolute! inset-0 [&_canvas]:h-full! [&_canvas]:w-full!"
          />
        )}
        {render === "image" && (
          <img
            src={fileUrl}
            alt=""
            onLoad={() => setDrawn(true)}
            className="absolute inset-0 size-full"
          />
        )}
        {page.elements.map((element) =>
          highlight.hidden.includes(element.type) ? null : (
            <Box
              key={element.id}
              element={element}
              hovered={highlight.hovered === element.id}
              selected={highlight.selected === element.id}
              onHover={highlight.onHover}
              onSelect={highlight.onSelect}
            />
          )
        )}
      </div>
    </section>
  );
});

const Box = memo(function Box({
  element,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  element: ParsedElement;
  hovered: boolean;
  selected: boolean;
  onHover: Highlight["onHover"];
  onSelect: Highlight["onSelect"];
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
    // biome-ignore lint/a11y/noStaticElementInteractions: the element list is the keyboard path to every box
    // biome-ignore lint/a11y/useKeyWithClickEvents: as above
    <div
      id={`box-${element.id}`}
      data-active={hovered || selected || undefined}
      data-selected={selected || undefined}
      onPointerEnter={() => onHover(element.id)}
      onPointerLeave={() => onHover(null)}
      onClick={() => onSelect(element.id, "page")}
      style={style}
      className="group absolute cursor-pointer scroll-my-24 rounded-[2px] bg-(--c)/6 outline-1 outline-(--c)/55 transition-[background-color,outline-color,outline-width] duration-150 hover:bg-(--c)/14 hover:outline-(--c) data-active:bg-(--c)/16 data-active:outline-(--c) data-selected:outline-2 data-selected:outline-offset-1"
    >
      <span className="pointer-events-none absolute bottom-full left-[-1px] mb-0.5 hidden rounded-[3px] bg-(--c) px-1 py-px text-[10px] leading-tight font-medium whitespace-nowrap text-white group-hover:block group-data-active:block">
        {typeOf(element.type).label}
      </span>
    </div>
  );
});
