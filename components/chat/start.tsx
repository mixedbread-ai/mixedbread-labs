"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRIMARY } from "@/components/controls";
import { DropCard, FileRow, StartLayout } from "@/components/drop-card";
import { PageHeader } from "@/components/shell/shell";
import { CHAT_ACCEPT, MAX_CHAT_FILES, type UploadedFile } from "@/lib/files";
import { errorMessage, postJson } from "@/lib/request";
import { uploadFile } from "@/lib/upload";

interface Picked {
  key: string;
  file: File;
  progress: number;
  uploaded?: UploadedFile;
  error?: string;
}

/** Pick files, which start uploading at once, then make a chat of them */
export function ChatStart() {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  function update(key: string, change: Partial<Picked>) {
    setPicked((current) =>
      current.map((item) => (item.key === key ? { ...item, ...change } : item))
    );
  }

  function pick(files: File[]) {
    const room = MAX_CHAT_FILES - picked.length;
    if (room <= 0) {
      setError(`A chat holds up to ${MAX_CHAT_FILES} files.`);
      return;
    }
    const added = files.slice(0, room).map((file) => ({
      key: crypto.randomUUID(),
      file,
      progress: 0,
    }));
    setPicked((current) => [...current, ...added]);
    setError(
      files.length > room
        ? `A chat holds up to ${MAX_CHAT_FILES} files.`
        : undefined
    );
    for (const { key, file } of added) {
      uploadFile(file, (progress) => update(key, { progress })).then(
        (uploaded) => update(key, { uploaded, progress: 1 }),
        (reason: Error) => update(key, { error: reason.message })
      );
    }
  }

  const uploaded = picked.flatMap(({ uploaded }) => uploaded ?? []);
  const waiting = picked.some(({ uploaded, error }) => !uploaded && !error);

  async function start() {
    setSubmitting(true);
    setError(undefined);
    try {
      const chat = await postJson<{ id: string }>("/api/chats", {
        files: uploaded,
      });
      router.push(`/chat/${chat.id}`);
    } catch (reason) {
      setError(errorMessage(reason));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="New chat" />
      <StartLayout title="Chat with your files">
        <DropCard
          multiple
          accept={CHAT_ACCEPT}
          hint={`Up to ${MAX_CHAT_FILES} documents, images or text files`}
          disabled={submitting || picked.length >= MAX_CHAT_FILES}
          onFiles={pick}
        >
          {picked.length > 0 &&
            picked.map((item) => (
              <FileRow
                key={item.key}
                name={item.file.name}
                size={item.file.size}
                progress={item.progress}
                error={item.error}
                onRemove={
                  submitting
                    ? undefined
                    : () =>
                        setPicked((current) =>
                          current.filter(({ key }) => key !== item.key)
                        )
                }
              />
            ))}
        </DropCard>
        {picked.length > 0 && (
          <div className="flex items-center gap-3 px-2">
            <p
              key={error}
              className={cn(
                "min-w-0 flex-1 text-[13px] motion-safe:animate-swap-in",
                error ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {error ??
                (waiting
                  ? "Uploading…"
                  : `${uploaded.length} of ${MAX_CHAT_FILES} files`)}
            </p>
            <button
              type="button"
              disabled={uploaded.length === 0 || waiting || submitting}
              onClick={() => void start()}
              className={PRIMARY}
            >
              {submitting ? "Creating…" : "Create chat"}
            </button>
          </div>
        )}
      </StartLayout>
    </>
  );
}
