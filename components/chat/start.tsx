"use client";

import { cn } from "cn";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRIMARY } from "@/components/controls";
import { Dropzone, UploadRow } from "@/components/dropzone";
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto my-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[13px] font-medium text-orange-700 dark:text-logo">
            Search and chat
          </p>
          <h1 className="text-2xl font-normal tracking-tight text-balance md:text-[2rem] md:leading-[1.15]">
            Ask your documents.
          </h1>
          <p className="max-w-md text-sm leading-6 text-balance text-muted-foreground">
            Upload files to make a chat. Answers cite the page they come from,
            and anyone with the link can ask too.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {picked.length < MAX_CHAT_FILES && (
            <Dropzone
              multiple
              accept={CHAT_ACCEPT}
              title="Drop files, or browse"
              hint={`Up to ${MAX_CHAT_FILES} documents, slides, images or text files`}
              onFiles={pick}
              className={cn(picked.length > 0 && "py-6")}
            />
          )}
          {picked.length > 0 && (
            <ul className="flex flex-col gap-2">
              {picked.map((item) => (
                <UploadRow
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
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          {error && (
            <p className="text-[13px] text-destructive motion-safe:animate-swap-in">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={uploaded.length === 0 || waiting || submitting}
            onClick={() => void start()}
            className={PRIMARY}
          >
            {submitting ? "Starting" : "Start chat"}
            <ArrowRightIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
