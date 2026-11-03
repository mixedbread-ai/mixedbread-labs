"use client";

import { cn } from "cn";
import { ArrowUpIcon, FileIcon, UploadIcon, XIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { formatBytes, MAX_FILE_BYTES } from "@/lib/files";
import { FOCUS } from "./controls";

/**
 * The composer, holding files instead of a question: drop or browse into it,
 * pick options in its bar, and send. `children` are the picked files.
 */
export function DropCard({
  accept,
  multiple = false,
  hint,
  onFiles,
  bar,
  ready,
  busy,
  action,
  onSubmit,
  children,
}: {
  accept: string;
  multiple?: boolean;
  /** What it takes, under the drop prompt */
  hint: string;
  onFiles: (files: File[]) => void;
  /** Pickers at the start of the bar */
  bar?: ReactNode;
  ready: boolean;
  busy: boolean;
  /** The send button's name */
  action: string;
  onSubmit: () => void;
  children?: ReactNode;
}) {
  const id = useId();
  const [over, setOver] = useState(false);
  const empty = !children;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a drop target; the file input inside is the keyboard path
    <div
      data-over={over || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className="flex w-full flex-col rounded-[22px] bg-card shadow-composer ring-1 ring-soft transition-[box-shadow] duration-200 ease-smooth data-over:shadow-[var(--elevation-composer),0_0_0_4px_color-mix(in_oklch,var(--logo-orange)_14%,transparent)] data-over:ring-logo/60"
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="peer sr-only"
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
      {empty ? (
        <label
          htmlFor={id}
          className="group m-2 mb-0 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl px-6 text-center transition-[background-color] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-ring hover:bg-muted/40"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-soft text-muted-foreground transition-[color,scale] duration-300 ease-spring group-hover:text-foreground in-data-over:scale-110 in-data-over:text-logo">
            <UploadIcon className="size-4.5" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-[15px]">
              Drop {multiple ? "files" : "a document"} here, or{" "}
              <span className="text-orange-700 underline decoration-current/30 underline-offset-4 dark:text-logo">
                browse
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {hint} · up to {formatBytes(MAX_FILE_BYTES)}
            </span>
          </span>
        </label>
      ) : (
        <ul className="flex flex-col gap-1.5 px-2.5 pt-2.5">{children}</ul>
      )}
      <div className="flex flex-wrap items-center gap-1 px-2.5 pt-2 pb-2.5">
        {!empty && multiple && (
          <label
            htmlFor={id}
            className="flex h-8 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-soft hover:text-foreground"
          >
            <UploadIcon className="size-3.5" />
            Add
          </label>
        )}
        {bar}
        <button
          type="button"
          disabled={!ready || busy}
          onClick={onSubmit}
          data-busy={busy || undefined}
          className={cn(
            "group/send relative ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-raised transition-[background-color,color,scale] duration-200 ease-out-quint active:scale-90 disabled:cursor-default disabled:bg-soft disabled:text-muted-foreground disabled:shadow-none data-busy:bg-foreground data-busy:text-background",
            FOCUS
          )}
        >
          <span
            aria-hidden="true"
            className="absolute -inset-[3px] rounded-full border-[1.5px] border-transparent border-t-logo opacity-0 transition-opacity duration-300 group-data-busy/send:opacity-100 group-data-busy/send:motion-safe:animate-spin"
          />
          <ArrowUpIcon className="size-4" strokeWidth={2.25} />
          <span className="sr-only">{action}</span>
        </button>
      </div>
    </div>
  );
}

/** A picked file on its way up: its name, size and how far it has got */
export function FileRow({
  name,
  size,
  progress,
  error,
  onRemove,
}: {
  name: string;
  size: number;
  /** 0 to 1; 1 once the API holds the file */
  progress: number;
  error?: string;
  onRemove?: () => void;
}) {
  const done = progress >= 1;

  return (
    <li className="relative flex h-11 items-center gap-2.5 overflow-hidden rounded-xl bg-muted/60 px-3 text-[13.5px] motion-safe:animate-rise dark:bg-muted/40">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span
        className={cn(
          "shrink-0 font-mono text-xs tabular-nums",
          error ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {error ?? (done ? formatBytes(size) : `${Math.round(progress * 100)}%`)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "-mr-1 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-soft hover:text-foreground",
            FOCUS
          )}
        >
          <XIcon className="size-3.5" />
          <span className="sr-only">Remove {name}</span>
        </button>
      )}
      {!done && !error && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-logo transition-[scale] duration-200"
          style={{ scale: `${progress} 1` }}
        />
      )}
    </li>
  );
}

/** A start page: a headline over the card, in the middle of the panel */
export function StartLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto my-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-[1.75rem] leading-[1.1] font-normal tracking-[-0.025em] text-balance motion-safe:animate-rise sm:text-[2.25rem]">
            {title}
          </h1>
          <p
            className="max-w-md text-sm leading-6 text-balance text-muted-foreground motion-safe:animate-rise"
            style={{ animationDelay: "60ms" }}
          >
            {description}
          </p>
        </div>
        <div
          className="w-full motion-safe:animate-rise"
          style={{ animationDelay: "120ms" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
