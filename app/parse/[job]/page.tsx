import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { ParsePending } from "@/components/parse/pending";
import { ParseView } from "@/components/parse/view";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { isRunning, MODES } from "@/lib/parse";

interface Props {
  params: Promise<{ job: string }>;
  searchParams: Promise<{ mode?: string }>;
}

const loadJob = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) return null;
  return getMixedbreadClient()
    .parsing.jobs.retrieve(id)
    .catch(() => null);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await loadJob((await params).job);
  return { title: job?.filename ?? "Parse" };
}

export default async function Page({ params, searchParams }: Props) {
  const [{ job: id }, { mode }] = await Promise.all([params, searchParams]);
  const job = await loadJob(id);
  if (!job) notFound();

  if (isRunning(job.status) || !job.result) {
    return <ParsePending job={job} />;
  }

  return (
    <ParseView
      job={job}
      result={job.result}
      mode={MODES.find(({ value }) => value === mode)?.value}
    />
  );
}
