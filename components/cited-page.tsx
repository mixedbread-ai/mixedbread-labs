"use client";

import { cn } from "cn";
import { FileTextIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  createHoverCardHandle,
  HoverCard,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  type DocMark,
  type DocPageView,
  type DocSource,
  pageLabel,
} from "@/lib/chat";
import { BADGE } from "./controls";

/** One card previews whichever source is hovered, so two never open at once */
export const sourceCard = createHoverCardHandle<DocSource>();

/** The page with its cited blocks boxed, the boxes showing once the image is in; a soft pulse holds its place until then */
function PageImage({
  view,
  label,
  sizes,
}: {
  view: DocPageView;
  label: string;
  sizes: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        "relative transition-[background-color] duration-200",
        loaded ? "bg-white" : "bg-muted motion-safe:animate-pulse"
      )}
    >
      {/* next/image sizes the full scan down to where it shows */}
      <Image
        src={view.image}
        alt={label}
        width={view.width}
        height={view.height}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        className={cn(
          "block h-auto w-full transition-opacity duration-200 motion-reduce:transition-none",
          !loaded && "opacity-0"
        )}
      />
      {loaded &&
        view.marks.map((mark) => (
          <span
            key={`${mark.x}:${mark.y}`}
            aria-hidden="true"
            style={{
              left: `${mark.x * 100}%`,
              top: `${mark.y * 100}%`,
              width: `${mark.width * 100}%`,
              height: `${mark.height * 100}%`,
            }}
            className="absolute rounded-[2px] bg-logo/12 outline-2 outline-offset-2 outline-logo/80 motion-safe:animate-swap-in"
          />
        ))}
    </div>
  );
}

const MARGIN = 0.025;
// The most of a page a frame shows before it is opened whole: boxes spread
// down a page start it, and the rest is a click away
const MAX_CROP = 0.35;

/** The page across its print, and down around its boxes, or its top when nothing is boxed */
function cropOf(view: DocPageView): DocMark {
  const printed = view.printed ?? { x: 0, y: 0, width: 1, height: 1 };
  const x = Math.max(printed.x - MARGIN, 0);
  const width = Math.min(printed.x + printed.width + MARGIN, 1) - x;
  if (view.marks.length === 0) {
    return { x, y: Math.max(printed.y - MARGIN, 0), width, height: 0.3 };
  }
  const top = Math.max(Math.min(...view.marks.map((m) => m.y)) - MARGIN, 0);
  const bottom = Math.max(...view.marks.map((m) => m.y + m.height)) + MARGIN;
  const height = Math.min(Math.max(Math.min(bottom, 1) - top, 0.08), MAX_CROP);
  return { x, y: Math.min(top, 1 - height), width, height };
}

/**
 * A page at the width of its print, framed to its boxes. Opened whole, it
 * grows to the full page around them, and the results scroll along, so the
 * boxes hold still while the rest of the page unfolds above and below.
 */
export function PageFrame({
  view,
  label,
  whole,
}: {
  view: DocPageView;
  label: string;
  whole: boolean;
}) {
  const crop = cropOf(view);
  // The page's height, in widths of the frame
  const tall = view.height / view.width / crop.width;
  const frame = useRef<HTMLDivElement>(null);

  // At every step of the frame's height, the part of the page above the boxes
  // shows in proportion, and the results move by what it adds, so the boxes
  // keep their place on screen. The page never scrolls inside the frame by hand.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const results = element.closest<HTMLElement>("[data-results]");
    let width = 0;
    let shift = 0;
    const follow = () => {
      const page = tall * element.clientWidth;
      const cut = crop.height * page;
      const open =
        page > cut
          ? Math.min(
              Math.max((element.clientHeight - cut) / (page - cut), 0),
              1
            )
          : 1;
      const next = crop.y * page * (1 - open);
      element.scrollTop = next;
      // Only as the height moves: a new width rescales everything at once
      if (results && element.clientWidth === width) {
        results.scrollTop += shift - next;
      }
      width = element.clientWidth;
      shift = next;
    };
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [crop.y, crop.height, tall]);

  return (
    <div className="@container">
      <div
        ref={frame}
        style={{
          height: `${(whole ? 1 : crop.height) * tall * 100}cqw`,
        }}
        className="overflow-hidden rounded-lg bg-muted shadow-raised ring-1 ring-soft transition-[height] duration-300 ease-out-quint motion-reduce:transition-none"
      >
        <div
          style={{
            width: `${100 / crop.width}%`,
            marginLeft: `${(-crop.x / crop.width) * 100}%`,
          }}
        >
          <PageImage
            view={view}
            label={label}
            sizes={`(min-width: 48rem) ${Math.ceil(42 / crop.width)}rem, ${Math.ceil(100 / crop.width)}vw`}
          />
        </div>
      </div>
    </div>
  );
}

/** The shared card, moving between the sources it previews */
export function SourceCards() {
  return (
    <HoverCard handle={sourceCard}>
      {({ payload }) =>
        payload && (
          // Pointers pass through the card, as clicking the citation opens its page
          <HoverCardContent
            side="top"
            className="pointer-events-none w-88 max-w-[calc(100vw-2rem)] rounded-xl border-0 p-3 shadow-float"
          >
            <SourceCard source={payload} />
          </HoverCardContent>
        )
      }
    </HoverCard>
  );
}

/** A citation's card: the blocks it cites, cropped from their page, or its text */
function SourceCard({ source }: { source: DocSource }) {
  const label = pageLabel(source);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
        <FileTextIcon className="size-3.5 shrink-0 text-logo" />
        <span className="truncate">{label}</span>
        <span className={cn(BADGE, "ml-auto")}>{source.n}</span>
      </p>
      {source.view ? (
        <PageFrame view={source.view} label={label} whole={false} />
      ) : (
        <p className="line-clamp-6 text-sm leading-6 text-muted-foreground">
          {source.preview}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Click to open it below the answer
      </p>
    </div>
  );
}
