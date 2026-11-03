"use client";

import { cn } from "cn";
import { useEffect, useState } from "react";
import { Playground } from "@/components/playground";
import { ShareButton } from "@/components/share-button";
import { type ChatFile, isIndexing } from "@/lib/chat";
import { request } from "@/lib/request";

const POLL_MS = 2000;

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

  useEffect(() => {
    if (!indexing) return;
    const timer = setTimeout(() => {
      request<ChatFile[]>(`/api/chats/${store}`).then(setFiles, () =>
        setFiles((current) => [...current])
      );
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [files, indexing, store]);

  const ready = files.some(({ status }) => status === "completed");
  const title =
    files.length === 1
      ? (files[0]?.filename ?? "")
      : `${files.length} documents`;

  return (
    <Playground
      store={store}
      ready={ready}
      intro={
        <>
          <p className="text-[13px] font-medium text-orange-700 dark:text-logo">
            {indexing ? "Indexing" : "Ask your documents"}
          </p>
          <h1 className="max-w-full truncate text-xl font-normal tracking-tight md:text-2xl">
            {title}
          </h1>
          {/* One finished file is already the title */}
          {(files.length > 1 || files[0]?.status !== "completed") && (
            <ul className="flex max-w-full flex-wrap justify-center gap-1.5">
              {files.map((file) => (
                <FileChip key={file.id} file={file} />
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            Anyone with the link can ask about these files.
            <ShareButton />
          </div>
        </>
      }
    />
  );
}

function FileChip({ file }: { file: ChatFile }) {
  const working = file.status === "pending" || file.status === "in_progress";

  return (
    <li
      title={file.status === "failed" ? "Couldn't be indexed" : undefined}
      className="flex min-w-0 items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs shadow-raised ring-1 ring-soft"
    >
      <span
        key={file.status}
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          working && "bg-logo motion-safe:animate-breathe",
          file.status === "completed" &&
            "bg-muted-foreground/45 motion-safe:animate-pop",
          (file.status === "failed" || file.status === "cancelled") &&
            "bg-destructive motion-safe:animate-pop"
        )}
      />
      <span className="max-w-56 truncate">{file.filename}</span>
    </li>
  );
}
