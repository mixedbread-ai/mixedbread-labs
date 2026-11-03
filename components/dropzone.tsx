"use client";

import { cn } from "cn";
import { UploadIcon } from "lucide-react";
import { useId, useState } from "react";
import { formatBytes, MAX_FILE_BYTES } from "@/lib/files";
import { CARD, FOCUS } from "./controls";

/** Takes files by drop or by browsing; `hint` names what it takes */
export function Dropzone({
  accept,
  multiple = false,
  title,
  hint,
  onFiles,
  className,
}: {
  accept: string;
  multiple?: boolean;
  title: string;
  hint: string;
  onFiles: (files: File[]) => void;
  className?: string;
}) {
  const id = useId();
  const [over, setOver] = useState(false);

  return (
    <label
      htmlFor={id}
      data-over={over || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn(
        CARD,
        "group flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-10 text-center transition-[box-shadow,background-color] duration-200 ease-out-quint hover:ring-foreground/20 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring data-over:bg-logo/5 data-over:ring-2 data-over:ring-logo/60",
        className
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-soft text-muted-foreground transition-[color,scale] duration-200 ease-out-quint group-hover:text-foreground group-data-over:scale-110 group-data-over:text-logo">
        <UploadIcon className="size-4.5" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">
          {hint} · up to {formatBytes(MAX_FILE_BYTES)}
        </span>
      </span>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className={cn("sr-only", FOCUS)}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
    </label>
  );
}

/** A file on its way up: its name, size and how far it has got */
export function UploadRow({
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
    <li
      className={cn(
        CARD,
        "flex flex-col gap-2 rounded-xl px-3.5 py-3 motion-safe:animate-rise"
      )}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : done ? (
            formatBytes(size)
          ) : (
            `${Math.round(progress * 100)}%`
          )}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "-mr-1 rounded-md px-1.5 text-xs text-muted-foreground transition-[color] hover:text-foreground",
              FOCUS
            )}
          >
            Remove
          </button>
        )}
      </div>
      {!done && !error && (
        <span
          aria-hidden="true"
          className="h-0.5 overflow-hidden rounded-full bg-soft"
        >
          <span
            className="block h-full origin-left rounded-full bg-logo transition-[scale] duration-200"
            style={{ scale: `${progress} 1` }}
          />
        </span>
      )}
    </li>
  );
}
