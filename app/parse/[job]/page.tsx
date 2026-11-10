import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { ParsePending } from "@/components/parse/pending";
import { ParseView } from "@/components/parse/view";
import { isMissing } from "@/lib/api";
import { getMixedbreadClient } from "@/lib/mixedbread";
import { isRunning, MODES } from "@/lib/parse";

interface Props {
  params: Promise<{ job: string }>;
  searchParams: Promise<{ mode?: string }>;
}

// Gone only when the API says so: any other failure, such as an outage,
// shows as an error, so the sidebar keeps a parse that's still there
const loadJob = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) return null;
  return getMixedbreadClient()
    .parsing.jobs.retrieve(id)
    .catch((error: unknown) => {
      if (isMissing(error)) return null;
      throw error;
    });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await loadJob((await params).job);
  // A result is open to anyone with its link, not to search engines
  return { title: job?.filename ?? "Parse", robots: { index: false } };
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
