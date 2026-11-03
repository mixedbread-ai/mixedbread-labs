"use client";

import { Popover } from "@base-ui/react/popover";
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
import { BUTTON, POPUP, PRIMARY, Segmented } from "@/components/controls";
import { ShareButton } from "@/components/share-button";
import { PageHeader } from "@/components/shell/shell";
import { useRemember } from "@/lib/history";
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
import type { Selection } from "./document";
import { Inspector } from "./inspector";
import { OptionsForm } from "./options";

const DocumentPages = dynamic(() => import("./document"), { ssr: false });

function kindOf(mimeType: string | null): "pdf" | "image" | "none" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType?.startsWith("image/")) return "image";
  return "none";
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
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
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState<ElementType[]>([]);
  const [pane, setPane] = useState<"document" | "elements">("document");
  const filename = job.filename ?? "document";
  const format = FORMATS.find(({ value }) => value === result.return_format);
  const modeLabel = MODES.find(({ value }) => value === mode)?.label;

  useRemember({
    kind: "parse",
    href: jobHref(job.id, mode ?? DEFAULT_OPTIONS.mode),
    title: filename,
    detail: [modeLabel, format?.label].filter(Boolean).join(" · "),
  });

  // Selecting on one side brings the element into view on the other
  const select = useCallback((id: string, from: "page" | "list") => {
    setSelected(id || null);
    if (!id) return;
    setPane(from === "list" ? "document" : "elements");
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

  const selection = useMemo<Selection>(
    () => ({ selected, hidden, onSelect: select }),
    [selected, hidden, select]
  );

  let elements = 0;
  for (const page of pages) elements += page.elements.length;
  const seconds =
    job.started_at && job.finished_at
      ? (Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000
      : null;

  return (
    <>
      <PageHeader
        title={
          <>
            <FileTextIcon className="size-4 shrink-0 text-logo" />
            <h1 className="truncate text-foreground">{filename}</h1>
            <span className="shrink-0 font-mono text-xs tabular-nums max-lg:hidden">
              {[
                plural(pages.length, "page"),
                plural(elements, "element"),
                seconds !== null && `${seconds.toFixed(1)}s`,
                modeLabel,
                format?.label,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </>
        }
        actions={
          <>
            <Reparse
              fileId={job.file_id}
              initial={{
                mode: mode ?? DEFAULT_OPTIONS.mode,
                return_format: result.return_format,
                element_types: result.element_types,
              }}
            />
            <ShareButton />
          </>
        }
      />

      <Segmented
        label="Show"
        value={pane}
        items={[
          { value: "document", label: "Document" },
          { value: "elements", label: "Elements" },
        ]}
        onChange={setPane}
        className="mx-2 mb-2 shrink-0 md:hidden"
      />

      <div className="grid min-h-0 flex-1 gap-3 px-2 pb-2 md:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] md:px-3 md:pb-3 xl:grid-cols-[minmax(0,1fr)_32rem]">
        <div
          className={cn(
            "min-h-0 overflow-hidden rounded-xl bg-background",
            pane !== "document" && "max-md:hidden"
          )}
        >
          <DocumentPages
            fileUrl={`/api/files/${job.file_id}`}
            kind={kindOf(mimeType)}
            pages={pages}
            selection={selection}
          />
        </div>
        <div
          className={cn(
            "flex min-h-0 flex-col",
            pane !== "elements" && "max-md:hidden"
          )}
        >
          <Inspector
            result={result}
            pages={pages}
            filename={filename}
            selection={selection}
            onHiddenChange={setHidden}
          />
        </div>
      </div>
    </>
  );
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
      <Popover.Trigger className={BUTTON}>
        <RotateCwIcon />
        <span className="max-sm:hidden">Parse again</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} className="z-50">
          <Popover.Popup
            className={cn(
              POPUP,
              "flex w-[min(24rem,calc(100vw-1rem))] flex-col gap-4 p-4"
            )}
          >
            <div className="flex flex-col gap-1">
              <Popover.Title className="text-sm font-medium">
                Parse again
              </Popover.Title>
              <Popover.Description className="text-xs text-muted-foreground">
                The same file with other options, as a new link to compare.
              </Popover.Description>
            </div>
            <OptionsForm options={options} onChange={setOptions} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className={cn(PRIMARY, "w-full")}
            >
              {submitting ? "Starting…" : "Parse"}
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
