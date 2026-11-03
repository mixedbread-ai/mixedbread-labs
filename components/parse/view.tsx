"use client";

import { Popover } from "@base-ui/react/popover";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type {
  DocumentParserResult,
  ElementType,
  ParsingJob,
} from "@mixedbread/sdk/resources/parsing/jobs";
import { cn } from "cn";
import { FileTextIcon, RotateCwIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  CARD,
  PILL,
  PRIMARY,
  SEGMENT,
  SEGMENT_PRESSED,
  SEGMENT_TRACK,
} from "@/components/controls";
import { ShareButton } from "@/components/share-button";
import {
  DEFAULT_OPTIONS,
  FORMATS,
  jobHref,
  MODES,
  type ParseMode,
  type ParseOptions,
  pagesOf,
} from "@/lib/parse";
import { postJson } from "@/lib/request";
import type { Highlight } from "./document";
import { OptionsForm } from "./options";
import { Results } from "./results";

const DocumentPages = dynamic(() => import("./document"), { ssr: false });

const CHIP =
  "rounded-[0.35rem] bg-soft px-1.5 py-px font-mono text-[11px] text-muted-foreground";

function kindOf(mimeType: string | null): "pdf" | "image" | "none" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType?.startsWith("image/")) return "image";
  return "none";
}

/** A finished parse: the pages with their elements boxed beside what the parser read */
export function ParseView({
  job,
  result,
  mimeType,
  mode,
}: {
  job: ParsingJob;
  result: DocumentParserResult;
  mimeType: string | null;
  mode?: ParseMode;
}) {
  const pages = useMemo(() => pagesOf(result), [result]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState<ElementType[]>([]);
  const [pane, setPane] = useState<"document" | "results">("document");
  const filename = job.filename ?? "document";

  // Selecting on one side brings the element into view on the other
  const select = useCallback((id: string, from: "page" | "list") => {
    setSelected(id);
    if (from === "list") setPane("document");
    else setPane("results");
    requestAnimationFrame(() =>
      document
        .getElementById(from === "page" ? `row-${id}` : `box-${id}`)
        ?.scrollIntoView({
          block: from === "page" ? "nearest" : "center",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        })
    );
  }, []);

  const highlight: Highlight = {
    hovered,
    selected,
    hidden,
    onHover: setHovered,
    onSelect: select,
  };

  let elements = 0;
  for (const page of pages) elements += page.elements.length;
  const seconds =
    job.started_at && job.finished_at
      ? (Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <FileTextIcon className="size-4 shrink-0 text-logo" />
          <h1 className="truncate text-sm font-medium">{filename}</h1>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <span>{plural(pages.length, "page")}</span>
          <span aria-hidden="true">·</span>
          <span>{plural(elements, "element")}</span>
          {seconds !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{seconds.toFixed(1)}s</span>
            </>
          )}
        </p>
        <p className="flex items-center gap-1 max-md:hidden">
          {mode && (
            <span className={CHIP}>
              {MODES.find(({ value }) => value === mode)?.label}
            </span>
          )}
          <span className={CHIP}>
            {FORMATS.find(({ value }) => value === result.return_format)?.label}
          </span>
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Reparse
            fileId={job.file_id}
            initial={{
              mode: mode ?? DEFAULT_OPTIONS.mode,
              return_format: result.return_format,
              element_types: result.element_types,
            }}
          />
          <ShareButton />
        </div>
      </div>

      <ToggleGroup
        value={[pane]}
        onValueChange={([value]) =>
          value && setPane(value === "results" ? "results" : "document")
        }
        className={cn(SEGMENT_TRACK, "mx-3 mb-3 flex shrink-0 md:hidden")}
      >
        {(["document", "results"] as const).map((value) => (
          <Toggle
            key={value}
            value={value}
            className={cn(SEGMENT, SEGMENT_PRESSED, "capitalize")}
          >
            {value}
          </Toggle>
        ))}
      </ToggleGroup>

      <div className="grid min-h-0 flex-1 gap-3 px-3 pb-3 sm:px-4 sm:pb-4 md:grid-cols-[minmax(0,1.15fr)_minmax(22rem,1fr)]">
        <div
          className={cn(
            "min-h-0 overflow-hidden rounded-2xl bg-muted/50 dark:bg-card/40",
            pane !== "document" && "max-md:hidden"
          )}
        >
          <DocumentPages
            fileUrl={`/api/files/${job.file_id}`}
            kind={kindOf(mimeType)}
            pages={pages}
            highlight={highlight}
          />
        </div>
        <div
          className={cn(
            CARD,
            "min-h-0 overflow-hidden",
            pane !== "results" && "max-md:hidden"
          )}
        >
          <Results
            result={result}
            pages={pages}
            filename={filename}
            highlight={highlight}
            onToggleType={setHidden}
          />
        </div>
      </div>
    </div>
  );
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Parses the same file again with other options, as a new link */
function Reparse({
  fileId,
  initial,
}: {
  fileId: string;
  initial: ParseOptions;
}) {
  const router = useRouter();
  const [options, setOptions] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function submit() {
    setSubmitting(true);
    setError(undefined);
    try {
      const job = await postJson<{ id: string }>("/api/parse", {
        file_id: fileId,
        ...options,
      });
      router.push(jobHref(job.id, options.mode));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setSubmitting(false);
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger className={PILL}>
        <RotateCwIcon className="size-3.5" />
        Parse again
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={6} className="z-50">
          <Popover.Popup className="flex w-[min(32rem,calc(100vw-2rem))] origin-(--transform-origin) flex-col gap-4 rounded-2xl bg-popover p-4 shadow-float ring-1 ring-soft transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Popover.Title className="text-sm font-medium">
              Parse this file again
            </Popover.Title>
            <OptionsForm options={options} onChange={setOptions} />
            <div className="flex items-center justify-end gap-3">
              {error && <p className="text-[13px] text-destructive">{error}</p>}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className={cn(PRIMARY, "h-8 px-3.5")}
              >
                {submitting ? "Starting" : "Parse"}
              </button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
