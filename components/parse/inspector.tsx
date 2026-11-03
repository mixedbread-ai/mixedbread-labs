"use client";

import { Menu } from "@base-ui/react/menu";
import { Tabs } from "@base-ui/react/tabs";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type {
  DocumentParserResult,
  ElementType,
} from "@mixedbread/sdk/resources/parsing/jobs";
import { cn } from "cn";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import {
  type CSSProperties,
  memo,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import {
  GHOST,
  GHOST_ICON,
  PICKER,
  POPUP,
  POPUP_ITEM,
  SEGMENT,
  SegmentList,
} from "@/components/controls";
import { HoverArea } from "@/components/ui/hover-area";
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

/** A bar above a tab's content */
const BAR = "flex h-10 shrink-0 items-center gap-1 px-1";

/** What the parser returned, three ways: element by element, as text, and as the API sent it */
export function Inspector({
  result,
  pages,
  filename,
  highlight,
  onHiddenChange,
}: {
  result: DocumentParserResult;
  pages: ParsedPage[];
  filename: string;
  highlight: Highlight;
  onHiddenChange: (hidden: ElementType[]) => void;
}) {
  return (
    <Tabs.Root defaultValue="elements" className="flex h-full min-h-0 flex-col">
      <SegmentList className="flex shrink-0">
        {["Elements", "Text", "JSON"].map((label) => (
          <Tabs.Tab key={label} value={label.toLowerCase()} className={SEGMENT}>
            {label}
          </Tabs.Tab>
        ))}
      </SegmentList>
      <Tabs.Panel value="elements" className="flex min-h-0 flex-1 flex-col">
        <Elements
          pages={pages}
          plain={result.return_format === "plain"}
          highlight={highlight}
          onHiddenChange={onHiddenChange}
        />
      </Tabs.Panel>
      <Tabs.Panel value="text" className="flex min-h-0 flex-1 flex-col">
        <TextView result={result} filename={filename} />
      </Tabs.Panel>
      <Tabs.Panel value="json" className="flex min-h-0 flex-1 flex-col">
        <JsonView result={result} filename={filename} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

/** Every element in reading order, filtered by type and text, above the one selected */
function Elements({
  pages,
  plain,
  highlight,
  onHiddenChange,
}: {
  pages: ParsedPage[];
  plain: boolean;
  highlight: Highlight;
  onHiddenChange: (hidden: ElementType[]) => void;
}) {
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim().toLowerCase());
  const { hidden, selected } = highlight;

  const { all, counts } = useMemo(() => {
    const elements: ParsedElement[] = [];
    const found = new Map<ElementType, number>();
    for (const page of pages) {
      for (const element of page.elements) {
        elements.push(element);
        found.set(element.type, (found.get(element.type) ?? 0) + 1);
      }
    }
    return { all: elements, counts: found };
  }, [pages]);

  const shown = all.filter(
    (element) =>
      !hidden.includes(element.type) &&
      (!search || element.preview.toLowerCase().includes(search))
  );
  const picked = selected
    ? all.find((element) => element.id === selected)
    : undefined;

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 pt-3 pb-2">
        <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-muted/60 px-2.5 text-muted-foreground ring-ring/40 transition-[box-shadow] focus-within:ring-2 dark:bg-muted/40">
          <SearchIcon className="size-3.5 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by text"
            aria-label="Filter elements by text"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <span className="shrink-0 font-mono text-[11px] tabular-nums">
            {shown.length === all.length
              ? all.length
              : `${shown.length}/${all.length}`}
          </span>
        </label>
        <TypeMenu counts={counts} hidden={hidden} onChange={onHiddenChange} />
      </div>

      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2">
        <HoverArea>
          <ol className="flex flex-col">
            {shown.map((element) => (
              <Row
                key={element.id}
                element={element}
                hovered={highlight.hovered === element.id}
                selected={selected === element.id}
                onHover={highlight.onHover}
                onSelect={highlight.onSelect}
              />
            ))}
          </ol>
        </HoverArea>
        {shown.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            No elements match.
          </p>
        )}
      </div>

      {picked && (
        <Detail
          key={picked.id}
          element={picked}
          plain={plain}
          onClose={() => highlight.onSelect("", "list")}
        />
      )}
    </>
  );
}

function TypeMenu({
  counts,
  hidden,
  onChange,
}: {
  counts: Map<ElementType, number>;
  hidden: readonly ElementType[];
  onChange: (hidden: ElementType[]) => void;
}) {
  const present = ELEMENT_TYPES.filter(({ type }) => counts.has(type));
  const showing = present.length - hidden.length;

  return (
    <Menu.Root>
      <Menu.Trigger className={PICKER}>
        {showing === present.length ? "All types" : `${showing} types`}
        <ChevronDownIcon className="opacity-60" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className={cn(POPUP, "w-56")}>
            {present.map(({ type, label }) => (
              <Menu.CheckboxItem
                key={type}
                closeOnClick={false}
                checked={!hidden.includes(type)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? hidden.filter((entry) => entry !== type)
                      : [...hidden, type]
                  )
                }
                style={{ "--c": typeColor(type) } as CSSProperties}
                className={POPUP_ITEM}
              >
                <span className="flex size-3.5 items-center justify-center">
                  <Menu.CheckboxItemIndicator>
                    <CheckIcon className="size-3.5" />
                  </Menu.CheckboxItemIndicator>
                </span>
                <span className="size-2 rounded-[2px] bg-(--c)" />
                {label}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
                  {counts.get(type)}
                </span>
              </Menu.CheckboxItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const Row = memo(function Row({
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
  return (
    <li id={`row-${element.id}`} data-row="" className="relative scroll-my-4">
      <button
        type="button"
        data-active={hovered || undefined}
        data-selected={selected || undefined}
        onPointerEnter={() => onHover(element.id)}
        onPointerLeave={() => onHover(null)}
        onClick={() => onSelect(element.id, "list")}
        style={{ "--c": typeColor(element.type) } as CSSProperties}
        className="grid w-full grid-cols-[6.5rem_minmax(0,1fr)_1.75rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-[background-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring not-hover:data-active:bg-[oklch(from_var(--foreground)_l_c_h/0.055)] data-selected:bg-(--c)/12"
      >
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 shrink-0 rounded-[2px] bg-(--c)" />
          <span className="truncate">{typeOf(element.type).label}</span>
        </span>
        <span className="truncate text-[13px] text-foreground/85">
          {element.preview || (
            <span className="text-muted-foreground italic">No text</span>
          )}
        </span>
        <span className="text-right font-mono text-[11px] text-muted-foreground tabular-nums">
          {element.page}
        </span>
      </button>
    </li>
  );
});

/** The selected element in full: its content as it reads, and where and how sure */
function Detail({
  element,
  plain,
  onClose,
}: {
  element: ParsedElement;
  plain: boolean;
  onClose: () => void;
}) {
  const [source, setSource] = useState(false);
  const [left, top, right, bottom] = element.bbox;

  return (
    <section
      aria-label="Selected element"
      style={{ "--c": typeColor(element.type) } as CSSProperties}
      className="flex max-h-[55%] shrink-0 flex-col overflow-hidden rounded-xl bg-card shadow-raised ring-1 ring-soft motion-safe:animate-rise"
    >
      <div className="flex h-10 shrink-0 items-center gap-2 pr-1 pl-3">
        <span className="size-2 rounded-[2px] bg-(--c)" />
        <span className="text-[13px] font-medium">
          {typeOf(element.type).label}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          p. {element.page} · {element.confidence.toFixed(2)}
        </span>
        <span className="ml-auto flex items-center">
          {!plain && (
            <Toggle
              pressed={source}
              onPressedChange={setSource}
              className={GHOST}
            >
              Source
            </Toggle>
          )}
          <CopyButton text={() => element.content} />
          <button
            type="button"
            onClick={onClose}
            className={cn(GHOST_ICON, "size-7")}
          >
            <XIcon className="size-3.5" />
            <span className="sr-only">Close</span>
          </button>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
        {element.image && (
          <img
            src={`data:image/png;base64,${element.image}`}
            alt={element.summary ?? ""}
            className="max-h-60 w-auto self-start rounded-lg bg-white ring-1 ring-soft"
          />
        )}
        {element.content.trim() ? (
          source || plain ? (
            <pre className="font-mono text-xs leading-5 break-words whitespace-pre-wrap">
              {element.content}
            </pre>
          ) : (
            <ParsedContent content={element.content} />
          )
        ) : (
          <p className="text-[13px] text-muted-foreground italic">No text</p>
        )}
        {element.summary && (
          <p className="text-xs leading-5 text-muted-foreground">
            {element.summary}
          </p>
        )}
        <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
          box {Math.round(left)}, {Math.round(top)} → {Math.round(right)},{" "}
          {Math.round(bottom)}
        </p>
      </div>
    </section>
  );
}

function CopyButton({ text, label }: { text: () => string; label?: string }) {
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
      className={label ? GHOST : cn(GHOST_ICON, "size-7")}
    >
      <IconSwap
        state={copied ? "b" : "a"}
        a={<CopyIcon className="size-3.5" />}
        b={<CheckIcon className="size-3.5" />}
      />
      {label ? (
        copied ? (
          "Copied"
        ) : (
          label
        )
      ) : (
        <span className="sr-only">Copy</span>
      )}
    </button>
  );
}

function DownloadButton({
  text,
  name,
  type,
}: {
  text: () => string;
  name: string;
  type: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = URL.createObjectURL(new Blob([text()], { type }));
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      }}
      className={GHOST}
    >
      <DownloadIcon />
      Download
    </button>
  );
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
    <>
      <div className={cn(BAR, "mt-2")}>
        {!plain && (
          <ToggleGroup
            value={[source ? "source" : "rendered"]}
            onValueChange={([value]) => value && setSource(value === "source")}
            className="flex gap-0.5"
          >
            <Toggle value="rendered" className={GHOST}>
              Rendered
            </Toggle>
            <Toggle value="source" className={GHOST}>
              Source
            </Toggle>
          </ToggleGroup>
        )}
        <span className="ml-auto flex items-center gap-0.5">
          <CopyButton text={all} label="Copy" />
          <DownloadButton
            text={all}
            name={`${baseName(filename)}.${EXTENSIONS[result.return_format]}`}
            type="text/plain"
          />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-4">
        {result.chunks.map((chunk, index) => {
          const content = chunk.content ?? chunk.content_to_embed;
          return (
            <section
              key={index}
              aria-label={`Page ${index + 1}`}
              className="flex flex-col gap-2 py-4 [contain-intrinsic-size:auto_40rem] [content-visibility:auto]"
            >
              <h2 className="font-mono text-[11px] text-muted-foreground tabular-nums">
                Page {index + 1}
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
    </>
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
    <>
      <div className={cn(BAR, "mt-2")}>
        <span className="px-1 font-mono text-[11px] text-muted-foreground">
          result
        </span>
        <span className="ml-auto flex items-center gap-0.5">
          <CopyButton text={full} label="Copy" />
          <DownloadButton
            text={full}
            name={`${baseName(filename)}.json`}
            type="application/json"
          />
        </span>
      </div>
      <pre className="mb-2 min-h-0 flex-1 overflow-auto overscroll-contain rounded-xl bg-muted/50 px-4 py-3 font-mono text-[11.5px] leading-5 dark:bg-muted/30">
        {shown}
      </pre>
    </>
  );
}
