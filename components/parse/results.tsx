"use client";

import { Tabs } from "@base-ui/react/tabs";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type {
  DocumentParserResult,
  ElementType,
} from "@mixedbread/sdk/resources/parsing/jobs";
import { cn } from "cn";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { type CSSProperties, memo, useMemo, useState } from "react";
import { FOCUS, SEGMENT, SegmentList } from "@/components/controls";
import { IconSwap } from "@/components/ui/icon-swap";
import {
  ELEMENT_TYPES,
  type ParsedElement,
  type ParsedPage,
  typeColor,
  typeOf,
} from "@/lib/parse";
import { ParsedContent } from "./content";
import type { Highlight } from "./document";

const SMALL_BUTTON = cn(
  "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-[background-color,color] duration-150 hover:bg-accent hover:text-foreground",
  FOCUS
);

/** What the parser returned, three ways: element by element, as text, and as the API sent it */
export function Results({
  result,
  pages,
  filename,
  highlight,
  onToggleType,
}: {
  result: DocumentParserResult;
  pages: ParsedPage[];
  filename: string;
  highlight: Highlight;
  onToggleType: (types: ElementType[]) => void;
}) {
  const plain = result.return_format === "plain";

  return (
    <Tabs.Root defaultValue="elements" className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-3 pt-3">
        <SegmentList className="flex">
          <Tabs.Tab value="elements" className={SEGMENT}>
            Elements
          </Tabs.Tab>
          <Tabs.Tab value="text" className={SEGMENT}>
            Text
          </Tabs.Tab>
          <Tabs.Tab value="json" className={SEGMENT}>
            JSON
          </Tabs.Tab>
        </SegmentList>
      </div>

      <Tabs.Panel value="elements" className="flex min-h-0 flex-1 flex-col">
        <TypeFilter
          pages={pages}
          hidden={highlight.hidden}
          onChange={onToggleType}
        />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {pages.map((page) => (
            <PageElements
              key={page.number}
              page={page}
              plain={plain}
              highlight={highlight}
            />
          ))}
        </div>
      </Tabs.Panel>

      <Tabs.Panel
        value="text"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <TextView result={result} filename={filename} />
      </Tabs.Panel>

      <Tabs.Panel
        value="json"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <JsonView result={result} filename={filename} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

/** Which types show, with how many of each the parser found */
function TypeFilter({
  pages,
  hidden,
  onChange,
}: {
  pages: ParsedPage[];
  hidden: readonly ElementType[];
  onChange: (hidden: ElementType[]) => void;
}) {
  const counts = useMemo(() => {
    const found = new Map<ElementType, number>();
    for (const page of pages) {
      for (const { type } of page.elements) {
        found.set(type, (found.get(type) ?? 0) + 1);
      }
    }
    return found;
  }, [pages]);
  const present = ELEMENT_TYPES.filter(({ type }) => counts.has(type));

  return (
    <ToggleGroup
      multiple
      value={present.flatMap(({ type }) =>
        hidden.includes(type) ? [] : [type]
      )}
      onValueChange={(shown) =>
        onChange(
          present.flatMap(({ type }) => (shown.includes(type) ? [] : [type]))
        )
      }
      className="flex shrink-0 flex-wrap gap-1.5 px-3 py-3"
    >
      {present.map(({ type, label }) => (
        <Toggle
          key={type}
          value={type}
          style={{ "--c": typeColor(type) } as CSSProperties}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs text-muted-foreground/70 ring-1 ring-soft transition-[background-color,color,box-shadow] duration-150 hover:text-foreground data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-raised dark:data-pressed:bg-muted",
            FOCUS
          )}
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-(--c) opacity-40 transition-[opacity] in-data-pressed:opacity-100"
          />
          {label}
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {counts.get(type)}
          </span>
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

function PageElements({
  page,
  plain,
  highlight,
}: {
  page: ParsedPage;
  plain: boolean;
  highlight: Highlight;
}) {
  const shown = page.elements.filter(
    ({ type }) => !highlight.hidden.includes(type)
  );
  if (shown.length === 0) return null;

  return (
    <section
      aria-label={`Page ${page.number}`}
      className="[contain-intrinsic-size:auto_40rem] [content-visibility:auto]"
    >
      <h2 className="sticky top-0 z-10 flex items-center gap-2 bg-card/90 px-4 py-2 text-xs text-muted-foreground backdrop-blur-sm sm:px-5">
        <span className="font-medium text-foreground">Page {page.number}</span>
        <span className="font-mono text-[11px] tabular-nums">
          {shown.length}
        </span>
      </h2>
      <ol className="flex flex-col pb-2">
        {shown.map((element) => (
          <ElementRow
            key={element.id}
            element={element}
            plain={plain}
            hovered={highlight.hovered === element.id}
            selected={highlight.selected === element.id}
            onHover={highlight.onHover}
            onSelect={highlight.onSelect}
          />
        ))}
      </ol>
    </section>
  );
}

const ElementRow = memo(function ElementRow({
  element,
  plain,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  element: ParsedElement;
  plain: boolean;
  hovered: boolean;
  selected: boolean;
  onHover: Highlight["onHover"];
  onSelect: Highlight["onSelect"];
}) {
  const { label } = typeOf(element.type);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the type label is the row's button
    <li
      id={`row-${element.id}`}
      data-active={hovered || undefined}
      data-selected={selected || undefined}
      onPointerEnter={() => onHover(element.id)}
      onPointerLeave={() => onHover(null)}
      onClick={() => onSelect(element.id, "list")}
      style={{ "--c": typeColor(element.type) } as CSSProperties}
      className="relative mx-2 flex scroll-my-12 flex-col gap-1.5 rounded-lg px-3 py-2.5 transition-[background-color] duration-150 before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-full before:bg-(--c) before:opacity-60 data-active:bg-muted/60 data-selected:bg-(--c)/8 data-selected:before:opacity-100"
    >
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(element.id, "list");
          }}
          className={cn("rounded-sm font-medium text-(--c)", FOCUS)}
        >
          {label}
        </button>
        <span
          title="Confidence"
          className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums"
        >
          {element.confidence.toFixed(2)}
        </span>
      </div>
      {element.image && (
        <img
          src={`data:image/png;base64,${element.image}`}
          alt={element.summary ?? ""}
          className="max-h-60 w-auto self-start rounded-md bg-white ring-1 ring-soft"
        />
      )}
      {element.content.trim() ? (
        <ParsedContent content={element.content} plain={plain} />
      ) : (
        <p className="text-xs text-muted-foreground italic">No text</p>
      )}
      {element.summary && (
        <p className="text-xs leading-5 text-muted-foreground">
          {element.summary}
        </p>
      )}
    </li>
  );
});

function CopyButton({
  text,
  label = "Copy",
}: {
  text: () => string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text()).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={SMALL_BUTTON}
    >
      <IconSwap
        state={copied ? "b" : "a"}
        a={<CopyIcon className="size-3.5" />}
        b={<CheckIcon className="size-3.5" />}
      />
      {copied ? "Copied" : label}
    </button>
  );
}

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "") || "document";
}

const EXTENSIONS = { markdown: "md", html: "html", plain: "txt" } as const;

/** The document's text page by page, as it reads or as the parser wrote it */
function TextView({
  result,
  filename,
}: {
  result: DocumentParserResult;
  filename: string;
}) {
  const [source, setSource] = useState(false);
  const plain = result.return_format === "plain";
  const all = () =>
    result.chunks.reduce(
      (text, chunk) =>
        `${text}${text && "\n\n"}${chunk.content ?? chunk.content_to_embed}`,
      ""
    );

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-1 bg-card/90 px-3 py-2 backdrop-blur-sm">
        {!plain && (
          <ToggleGroup
            value={[source ? "source" : "rendered"]}
            onValueChange={([value]) => value && setSource(value === "source")}
            className="flex gap-0.5"
          >
            {["rendered", "source"].map((value) => (
              <Toggle
                key={value}
                value={value}
                className={cn(
                  SMALL_BUTTON,
                  "capitalize data-pressed:bg-soft data-pressed:text-foreground"
                )}
              >
                {value}
              </Toggle>
            ))}
          </ToggleGroup>
        )}
        <span className="ml-auto flex items-center gap-1">
          <CopyButton text={all} />
          <button
            type="button"
            onClick={() =>
              download(
                all(),
                `${baseName(filename)}.${EXTENSIONS[result.return_format]}`,
                "text/plain"
              )
            }
            className={SMALL_BUTTON}
          >
            <DownloadIcon className="size-3.5" />
            Download
          </button>
        </span>
      </div>
      {result.chunks.map((chunk, index) => {
        const content = chunk.content ?? chunk.content_to_embed;
        return (
          <section
            key={index}
            aria-label={`Page ${index + 1}`}
            className="flex flex-col gap-2 px-4 py-4 [contain-intrinsic-size:auto_40rem] [content-visibility:auto] sm:px-5"
          >
            <h2 className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {index + 1}
            </h2>
            {source || plain ? (
              <pre className="font-mono text-xs leading-5 break-words whitespace-pre-wrap">
                {content}
              </pre>
            ) : (
              <ParsedContent content={content} />
            )}
          </section>
        );
      })}
    </div>
  );
}

/** The result as the API returns it, figures' image data cut short to keep it readable */
function JsonView({
  result,
  filename,
}: {
  result: DocumentParserResult;
  filename: string;
}) {
  const shown = useMemo(
    () =>
      JSON.stringify(
        result,
        (key, value) =>
          key === "image" && typeof value === "string"
            ? `<${Math.round((value.length * 3) / 4 / 1024)} KB base64>`
            : value,
        2
      ),
    [result]
  );
  const full = () => JSON.stringify(result, null, 2);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-end gap-1 bg-card/90 px-3 py-2 backdrop-blur-sm">
        <CopyButton text={full} />
        <button
          type="button"
          onClick={() =>
            download(full(), `${baseName(filename)}.json`, "application/json")
          }
          className={SMALL_BUTTON}
        >
          <DownloadIcon className="size-3.5" />
          Download
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-5 sm:px-5">
        {shown}
      </pre>
    </div>
  );
}
