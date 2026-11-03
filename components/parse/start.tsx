"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DropCard, FileRow, StartLayout } from "@/components/drop-card";
import { PageHeader } from "@/components/shell/shell";
import { PARSE_ACCEPT, type UploadedFile } from "@/lib/files";
import { DEFAULT_OPTIONS, jobHref, type ParseOptions } from "@/lib/parse";
import { postJson } from "@/lib/request";
import { uploadFile } from "@/lib/upload";
import { OptionsBar } from "./options";

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
    <>
      <PageHeader title="Parse" />
      <StartLayout
        title="What should we parse?"
        description="See every element the parser finds, boxed on its page. Each result is a link you can share."
      >
        <DropCard
          accept={PARSE_ACCEPT}
          hint="PDF, Word, slides or an image"
          onFiles={([file]) => file && pick(file)}
          bar={<OptionsBar options={options} onChange={setOptions} />}
          ready={!!picked && !picked.error}
          busy={submitting}
          action="Parse"
          onSubmit={() => void parse()}
        >
          {picked && (
            <FileRow
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
          )}
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
