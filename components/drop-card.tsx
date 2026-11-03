"use client";

import { cn } from "cn";
import { FileIcon, GlobeIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { formatBytes, MAX_FILE_BYTES } from "@/lib/files";
import { FOCUS, HEADLINE } from "./controls";

/**
 * A raised card that takes files by drop or by browsing. Empty, the whole card
 * is the prompt; once files are in, `children` lists them, with room to add
 * more when it takes several.
 */
export function DropCard({
  accept,
  multiple = false,
  hint,
  disabled = false,
  onFiles,
  footer,
  children,
}: {
  accept: string;
  multiple?: boolean;
  /** What it takes, under the prompt */
  hint: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  /** Under the files, set apart: what applies to them, such as options */
  footer?: ReactNode;
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
        if (!disabled) setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (!disabled && files.length > 0) {
          onFiles(multiple ? files : files.slice(0, 1));
        }
      }}
      className="w-full rounded-[22px] bg-card p-2 shadow-composer ring-1 ring-soft transition-[box-shadow] duration-200 ease-smooth data-over:shadow-[var(--elevation-composer),0_0_0_4px_color-mix(in_oklch,var(--logo-orange)_14%,transparent)] data-over:ring-logo/60"
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
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
          className="group flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center transition-[background-color] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-muted/50"
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
            {/* Each phrase stays whole, so a narrow card breaks between them */}
            <span className="text-xs text-muted-foreground">
              <span className="inline-block">{hint},</span>{" "}
              <span className="inline-block">
                {multiple ? "" : "up to "}
                {formatBytes(MAX_FILE_BYTES)}
                {multiple ? " each" : ""}
              </span>
            </span>
          </span>
        </label>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {children}
          {multiple && !disabled && (
            <li>
              <label
                htmlFor={id}
                className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-[13.5px] text-muted-foreground outline-1 -outline-offset-1 outline-soft transition-[background-color,color] duration-150 outline-dashed peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-solid hover:bg-muted/50 hover:text-foreground"
              >
                <PlusIcon className="size-4" />
                Add more files
              </label>
            </li>
          )}
        </ul>
      )}
      {footer && (
        <div className="mt-2 border-t border-soft px-2 pt-3 pb-1">{footer}</div>
      )}
    </div>
  );
}

/** A picked file: its name, and its size or how far it has got */
export function FileRow({
  name,
  size,
  progress,
  status,
  error,
  onRemove,
}: {
  name: string;
  size: number;
  /** 0 to 1; 1 once the API holds the file */
  progress: number;
  /** Replaces the size once uploaded, such as what happens next */
  status?: string;
  error?: string;
  onRemove?: () => void;
}) {
  const done = progress >= 1;
  let note = status ?? formatBytes(size);
  if (!done) note = `Uploading ${Math.round(progress * 100)}%`;
  if (error) note = "Couldn't upload";

  return (
    <li className="relative flex h-11 items-center gap-2.5 overflow-hidden rounded-xl bg-muted/60 pr-1.5 pl-3 text-[13.5px] motion-safe:animate-rise dark:bg-muted/40">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {/* Slides in when the phase changes; the percentage counts up in place */}
      <span
        key={error ? "error" : done ? "done" : "uploading"}
        title={error}
        className={cn(
          "max-w-[45%] shrink-0 truncate text-xs tabular-nums motion-safe:animate-swap-in",
          error ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {note}
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-soft hover:text-foreground",
            FOCUS
          )}
        >
          <XIcon className="size-4" />
          <span className="sr-only">Remove {name}</span>
        </button>
      ) : (
        <span className="w-1.5 shrink-0" />
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

/**
 * A start page: a headline over the card, in the middle of the panel, and
 * under it a reminder that what goes up is public
 */
export function StartLayout({
  title,
  children,
}: {
  /** What the page does, in a few words */
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto my-auto flex w-full max-w-xl flex-col items-center gap-8 px-4 py-10">
        <h1 className={cn(HEADLINE, "text-center motion-safe:animate-rise")}>
          {title}
        </h1>
        <div
          className="flex w-full flex-col gap-4 motion-safe:animate-rise"
          style={{ animationDelay: "60ms" }}
        >
          {children}
          <p
            role="note"
            className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground"
          >
            <GlobeIcon className="size-3.5 -translate-y-[0.5px]" />
            Public to anyone with the link
          </p>
        </div>
      </div>
    </div>
  );
}
