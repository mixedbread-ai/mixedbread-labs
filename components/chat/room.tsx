"use client";

import { Popover } from "@base-ui/react/popover";
import { cn } from "cn";
import { ChevronDownIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { HEADLINE, PICKER, POPUP, ToastMark } from "@/components/controls";
import { Playground } from "@/components/playground";
import { ShareButton } from "@/components/share-button";
import { PageHeader } from "@/components/shell/shell";
import { CHAT_MODEL_NAME, type ChatFile, isIndexing } from "@/lib/chat";
import { useRemember } from "@/lib/history";
import { request } from "@/lib/request";
import { plural } from "@/lib/text";

const POLL_MS = 2000;

const STATUS: Record<ChatFile["status"], string> = {
  pending: "Queued",
  in_progress: "Indexing",
  completed: "Ready",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** A chat: its files' indexing while it runs, then search and chat over them */
export function ChatRoom({
  store,
  initialFiles,
}: {
  store: string;
  initialFiles: ChatFile[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const indexing = isIndexing(files);
  const ready = files.some(({ status }) => status === "completed");
  const title =
    files.length === 1
      ? (files[0]?.filename ?? "")
      : `${files[0]?.filename ?? "Files"} and ${files.length - 1} more`;

  useRemember({
    kind: "chat",
    href: `/chat/${store}`,
    title,
    detail: plural(files.length, "file"),
  });

  useEffect(() => {
    if (!indexing) return;
    const timer = setTimeout(() => {
      request<ChatFile[]>(`/api/chats/${store}`).then(setFiles, () =>
        setFiles((current) => [...current])
      );
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [files, indexing, store]);

  return (
    <>
      <PageHeader
        title={<h1 className="truncate">{title}</h1>}
        actions={
          <>
            <FilesPopover files={files} />
            <ShareButton />
          </>
        }
      />
      <Playground
        store={store}
        ready={ready}
        intro={
          indexing && !ready ? (
            <>
              <ToastMark live />
              <h2 className={HEADLINE}>Reading your files</h2>
              <p className="max-w-md text-sm leading-6 text-balance text-muted-foreground">
                Mixedbread is parsing and indexing them. You can ask as soon as
                one is ready.
              </p>
              <FileList files={files} className="w-full max-w-sm" />
            </>
          ) : (
            <>
              <h2 className={cn(HEADLINE, "motion-safe:animate-rise")}>
                What do you want to know?
              </h2>
              <p className="max-w-md text-sm leading-6 text-balance text-muted-foreground">
                Search{" "}
                {files.length === 1 ? "the file" : `${files.length} files`}, or
                ask {CHAT_MODEL_NAME} with Toast 1 as its search. Answers cite
                the page they come from.
              </p>
            </>
          )
        }
      />
    </>
  );
}

function FilesPopover({ files }: { files: ChatFile[] }) {
  const working = isIndexing(files);

  return (
    <Popover.Root>
      <Popover.Trigger className={cn(PICKER, "max-sm:hidden")}>
        <StatusDot status={working ? "in_progress" : "completed"} />
        {plural(files.length, "file")}
        <ChevronDownIcon className="opacity-60" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} className="z-50">
          <Popover.Popup className={cn(POPUP, "w-80 p-1.5")}>
            <Popover.Title className="px-1.5 pt-1 pb-1.5 text-[11px] text-muted-foreground">
              Files
            </Popover.Title>
            <FileList files={files} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function FileList({
  files,
  className,
}: {
  files: ChatFile[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-px text-left", className)}>
      {files.map((file) => (
        <li
          key={file.id}
          className="flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13.5px]"
        >
          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{file.filename}</span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <StatusDot status={file.status} />
            {STATUS[file.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatusDot({ status }: { status: ChatFile["status"] }) {
  const working = status === "pending" || status === "in_progress";

  return (
    <span
      key={status}
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        working && "bg-logo motion-safe:animate-breathe",
        status === "completed" && "bg-emerald-500 motion-safe:animate-pop",
        (status === "failed" || status === "cancelled") &&
          "bg-destructive motion-safe:animate-pop"
      )}
    />
  );
}
