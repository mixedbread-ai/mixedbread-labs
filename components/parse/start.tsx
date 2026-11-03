"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DropCard, FileRow, StartLayout } from "@/components/drop-card";
import { PageHeader } from "@/components/shell/shell";
import { PARSE_ACCEPT, type UploadedFile } from "@/lib/files";
import { DEFAULT_OPTIONS, jobHref, type ParseOptions } from "@/lib/parse";
import { postJson } from "@/lib/request";
import { uploadFile } from "@/lib/upload";
import { OptionsPanel } from "./options";

interface Picked {
  file: File;
  progress: number;
  error?: string;
}

/** Drop a document and it parses at once, with the options below the card */
export function ParseStart() {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [options, setOptions] = useState<ParseOptions>(DEFAULT_OPTIONS);

  async function parse(file: File) {
    setPicked({ file, progress: 0 });
    try {
      const uploaded: UploadedFile = await uploadFile(file, (progress) =>
        setPicked((current) =>
          current?.file === file ? { ...current, progress } : current
        )
      );
      const job = await postJson<{ id: string }>("/api/parse", {
        file_id: uploaded.id,
        ...options,
      });
      router.push(jobHref(job.id, options.mode));
    } catch (reason) {
      const error = reason instanceof Error ? reason.message : String(reason);
      setPicked((current) =>
        current?.file === file ? { ...current, error } : current
      );
    }
  }

  return (
    <>
      <PageHeader title="Parse" />
      <StartLayout
        title="What should we parse?"
        description="Drop a document to see every element the parser finds, boxed on its page. Each result is a link you can share."
      >
        <DropCard
          accept={PARSE_ACCEPT}
          hint="PDF, Word, slides or an image"
          disabled={!!picked && !picked.error}
          onFiles={([file]) => file && void parse(file)}
        >
          {picked && (
            <FileRow
              name={picked.file.name}
              size={picked.file.size}
              progress={picked.progress}
              status="Starting parse…"
              error={picked.error}
              onRemove={picked.error ? () => setPicked(null) : undefined}
            />
          )}
        </DropCard>
        <OptionsPanel
          options={options}
          onChange={setOptions}
          disabled={!!picked && !picked.error}
        />
      </StartLayout>
    </>
  );
}
