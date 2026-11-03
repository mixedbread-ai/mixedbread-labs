"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DropCard, FileRow, StartLayout } from "@/components/drop-card";
import { PageHeader } from "@/components/shell/shell";
import { PARSE_ACCEPT, type UploadedFile } from "@/lib/files";
import { DEFAULT_OPTIONS, type ParseOptions, startParse } from "@/lib/parse";
import { errorMessage } from "@/lib/request";
import { uploadFile } from "@/lib/upload";
import { OptionsForm } from "./options";

interface Picked {
  file: File;
  progress: number;
  error?: string;
}

/** Set the options, then drop a document and it parses at once */
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
      router.push(await startParse(uploaded.id, options));
    } catch (reason) {
      const error = errorMessage(reason);
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
        description="Pick the options, then drop a document to see every element the parser finds, boxed on its page."
      >
        <DropCard
          accept={PARSE_ACCEPT}
          hint="PDF, Word, slides or an image"
          disabled={!!picked && !picked.error}
          onFiles={([file]) => file && void parse(file)}
          footer={
            <OptionsForm
              options={options}
              onChange={setOptions}
              disabled={!!picked && !picked.error}
            />
          }
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
      </StartLayout>
    </>
  );
}
