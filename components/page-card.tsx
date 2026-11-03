"use client";

import { Tabs } from "@base-ui/react/tabs";
import { cn } from "cn";
import {
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  FileTextIcon,
  ScanIcon,
  TextIcon,
} from "lucide-react";
import Image from "next/image";
import { type ReactNode, useState } from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  type DocPage,
  type DocPageView,
  type DocSegment,
  pageLabel,
} from "@/lib/chat";
import { plainText } from "@/lib/text";
import { PageFrame } from "./cited-page";
import { FOCUS, FOLD, Reveal } from "./controls";
import { COMPONENTS, Markdown } from "./markdown";

/**
 * A passage, the same in search and chat: its page beside the start of the
 * marked text, opening in place to the page framed to its boxes or its text
 * with the same blocks marked. `meta` sits at the end of the
 * header: a search's relevance, an answer's citation number.
 */
export function PageCard({
  page,
  meta,
  open,
  onOpenChange,
  highlighted = false,
  delay = 0,
  id,
}: {
  page: DocPage;
  meta?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  highlighted?: boolean;
  delay?: number;
  id?: string;
}) {
  const label = pageLabel(page);
  // The page loads on first open, then stays for the fold to close over
  const [opened, setOpened] = useState(false);

  return (
    <li
      id={id}
      className="scroll-mt-4 motion-safe:animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* The card is the whole Collapsible: the trigger's overlay makes all of
          it clickable, and the opened view sits above that, in the column
          beside the thumbnail, so its tabs and text take the pointer and it
          starts right under the header */}
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          if (next) setOpened(true);
          onOpenChange?.(next);
        }}
        data-highlighted={highlighted || undefined}
        className="group relative flex rounded-xl p-3 ring-logo/0 transition-[background-color,box-shadow] duration-300 hover:bg-muted/40 data-highlighted:bg-logo/8 data-highlighted:ring-2 data-highlighted:ring-logo/40 data-open:bg-muted/30"
      >
        {/* On a phone the opened page takes the thumbnail's column too */}
        <span className="mr-4 flex w-12 shrink-0 self-start transition-[width,margin,opacity] duration-250 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none max-sm:group-data-open:mr-0 max-sm:group-data-open:w-0 max-sm:group-data-open:opacity-0">
          <Thumbnail view={page.view} label={label} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <CollapsibleTrigger className="flex w-full flex-col text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring">
            <span className="flex items-center gap-2 text-[13px]">
              <span className="truncate font-medium text-foreground">
                {label}
              </span>
              <span className="ml-auto flex items-center gap-2">{meta}</span>
              <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground opacity-60 transition-[rotate] duration-250 ease-[cubic-bezier(0.2,0,0,1)] group-data-open:rotate-90 motion-reduce:transition-none" />
            </span>
            {/* Folds away as the full text unfolds below, on the same curve */}
            <span
              className={cn(
                "grid grid-rows-[1fr] group-data-open:grid-rows-[0fr] group-data-open:opacity-0",
                FOLD
              )}
            >
              <span className="min-h-0 overflow-hidden">
                <span className="line-clamp-2 pt-1.5 text-sm leading-6 text-muted-foreground">
                  {previewOf(page.segments)}
                </span>
              </span>
            </span>
          </CollapsibleTrigger>
          <Reveal>
            <div className="relative pt-2 pb-1">
              {(opened || open) && <Opened page={page} label={label} />}
            </div>
          </Reveal>
        </div>
      </Collapsible>
    </li>
  );
}

const THUMBNAIL =
  "w-12 shrink-0 self-start rounded-md bg-muted shadow-raised ring-1 ring-soft transition-[box-shadow] duration-200 group-hover:ring-foreground/20 motion-reduce:transition-none";

function Thumbnail({
  view,
  label,
}: {
  view: DocPageView | null;
  label: string;
}) {
  if (!view) {
    return (
      <span className={cn(THUMBNAIL, "flex h-16 items-center justify-center")}>
        <FileTextIcon className="size-4 text-muted-foreground" />
      </span>
    );
  }
  return (
    <Image
      src={view.image}
      alt={label}
      width={view.width}
      height={view.height}
      sizes="3rem"
      className={cn(THUMBNAIL, "h-auto")}
    />
  );
}

/** The start of the marked text, or of the page when nothing is marked */
function previewOf(segments: DocSegment[]): string {
  const segment = segments.find(({ marked }) => marked) ?? segments[0];
  return plainText(segment?.markdown ?? "");
}

const VIEW_BUTTON = cn(
  "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-[color,background-color] duration-150 hover:text-foreground data-active:bg-soft data-active:text-foreground",
  FOCUS
);

/** An opened page: framed to its boxes, or its text with the same blocks marked */
function Opened({ page, label }: { page: DocPage; label: string }) {
  const [tab, setTab] = useState<"page" | "text">("page");
  const [whole, setWhole] = useState(false);
  const { view } = page;

  if (!view) return <PageText segments={page.segments} />;

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(value) => setTab(value === "text" ? "text" : "page")}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-1">
        <Tabs.List aria-label="Show" className="flex gap-1">
          <Tabs.Tab value="page" className={VIEW_BUTTON}>
            <ScanIcon className="size-3" />
            Page
          </Tabs.Tab>
          <Tabs.Tab value="text" className={VIEW_BUTTON}>
            <TextIcon className="size-3" />
            Text
          </Tabs.Tab>
        </Tabs.List>
        {tab === "page" && (
          <button
            type="button"
            aria-expanded={whole}
            onClick={() => setWhole(!whole)}
            className={cn(VIEW_BUTTON, "ml-auto motion-safe:animate-swap-in")}
          >
            {whole ? (
              <ChevronsDownUpIcon className="size-3" />
            ) : (
              <ChevronsUpDownIcon className="size-3" />
            )}
            {whole ? "Show less" : "Whole page"}
          </button>
        )}
      </div>
      <Tabs.Panel value="page" className={cn("rounded-lg", FOCUS)}>
        <PageFrame view={view} label={label} whole={whole} />
      </Tabs.Panel>
      <Tabs.Panel value="text" className={cn("rounded-lg", FOCUS)}>
        <PageText segments={page.segments} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

/**
 * Moves the view so the marked text starts near the top, a few lines before
 * it in view. The text comes in with the Markdown renderer, so this waits for
 * the box to fill, when everything above it has its height too.
 */
function showFirstMark(element: HTMLDivElement) {
  const observer = new ResizeObserver(() => {
    if (element.childElementCount === 0) return;
    observer.disconnect();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({
      block: "start",
      behavior: reduced ? "instant" : "smooth",
    });
  });
  observer.observe(element);
  return () => observer.disconnect();
}

function PageText({ segments }: { segments: DocSegment[] }) {
  const first = segments.findIndex((segment) => segment.marked);

  return (
    <div className="flex flex-col gap-3 text-sm leading-6">
      {segments.map((segment, index) => (
        <div
          key={segment.markdown}
          ref={index === first ? showFirstMark : undefined}
          className={cn(
            "flex scroll-mt-20 flex-col gap-3",
            segment.marked &&
              "-mx-2 rounded-md bg-logo/10 px-2 py-1 ring-1 ring-logo/60"
          )}
        >
          <Markdown components={COMPONENTS}>{segment.markdown}</Markdown>
        </div>
      ))}
    </div>
  );
}
