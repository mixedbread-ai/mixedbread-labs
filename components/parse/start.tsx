"use client";

import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PRIMARY } from "@/components/controls";
import { Dropzone, UploadRow } from "@/components/dropzone";
import { PARSE_ACCEPT, type UploadedFile } from "@/lib/files";
import { DEFAULT_OPTIONS, jobHref, type ParseOptions } from "@/lib/parse";
import { postJson } from "@/lib/request";
import { uploadFile } from "@/lib/upload";
import { OptionsForm } from "./options";

interface Picked {
  file: File;
  progress: number;
  error?: string;
}

/** Pick a file, which starts uploading at once, and the options, then parse */
export function ParseStart() {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [options, setOptions] = useState<ParseOptions>(DEFAULT_OPTIONS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const upload = useRef<Promise<UploadedFile> | null>(null);

  function pick(file: File) {
    setPicked({ file, progress: 0 });
    setError(undefined);
    const started = uploadFile(file, (progress) =>
      setPicked((current) =>
        current?.file === file ? { ...current, progress } : current
      )
    );
    upload.current = started;
    started.catch((reason: Error) =>
      setPicked((current) =>
        current?.file === file ? { ...current, error: reason.message } : current
      )
    );
  }

  async function parse() {
    if (!upload.current) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const file = await upload.current;
      const job = await postJson<{ id: string }>("/api/parse", {
        file_id: file.id,
        ...options,
      });
      router.push(jobHref(job.id, options.mode));
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
            Document parsing
          </p>
          <h1 className="text-2xl font-normal tracking-tight text-balance md:text-[2rem] md:leading-[1.15]">
            See what our parser reads.
          </h1>
          <p className="max-w-md text-sm leading-6 text-balance text-muted-foreground">
            Upload a document and inspect every title, table and figure it
            finds, boxed on the page. Each result is a link you can share.
          </p>
        </div>

        {picked ? (
          <ul>
            <UploadRow
              name={picked.file.name}
              size={picked.file.size}
              progress={picked.progress}
              error={picked.error}
              onRemove={
                submitting
                  ? undefined
                  : () => {
                      setPicked(null);
                      upload.current = null;
                    }
              }
            />
          </ul>
        ) : (
          <Dropzone
            accept={PARSE_ACCEPT}
            title="Drop a document, or browse"
            hint="PDF, Word, slides or an image"
            onFiles={([file]) => file && pick(file)}
          />
        )}

        <OptionsForm options={options} onChange={setOptions} />

        <div className="flex items-center justify-end gap-3">
          {error && (
            <p className="text-[13px] text-destructive motion-safe:animate-swap-in">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={!picked || !!picked.error || submitting}
            onClick={() => void parse()}
            className={PRIMARY}
          >
            {submitting ? "Starting" : "Parse"}
            <ArrowRightIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
