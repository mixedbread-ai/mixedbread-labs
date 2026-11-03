"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DropCard, FileRow, StartLayout } from "@/components/drop-card";
import { PageHeader } from "@/components/shell/shell";
import { CHAT_ACCEPT, MAX_CHAT_FILES, type UploadedFile } from "@/lib/files";
import { postJson } from "@/lib/request";
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
      setError(reason instanceof Error ? reason.message : String(reason));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="New chat" />
      <StartLayout
        title="What do you want to ask?"
        description="Upload files to search and chat with. Answers cite the page they come from, and anyone with the link can ask too."
      >
        <DropCard
          multiple
          accept={CHAT_ACCEPT}
          hint={`Up to ${MAX_CHAT_FILES} documents, slides, images or text files`}
          onFiles={pick}
          bar={
            picked.length > 0 && (
              <span className="px-1.5 text-[13px] text-muted-foreground tabular-nums">
                {picked.length} of {MAX_CHAT_FILES}
              </span>
            )
          }
          ready={uploaded.length > 0 && !waiting}
          busy={submitting}
          action="Create chat"
          onSubmit={() => void start()}
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
        {error && (
          <p className="mt-3 text-center text-[13px] text-destructive motion-safe:animate-swap-in">
            {error}
          </p>
        )}
      </StartLayout>
    </>
  );
}
