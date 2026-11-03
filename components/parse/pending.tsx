"use client";

import type { ParsingJob } from "@mixedbread/sdk/resources/parsing/jobs";
import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FOCUS, ToastMark } from "@/components/controls";
import { isRunning } from "@/lib/parse";
import { request } from "@/lib/request";

const POLL_MS = 1500;

/** A job still running, or one that ended without a result */
export function ParsePending({ job }: { job: ParsingJob }) {
  const router = useRouter();
  const running = isRunning(job.status);
  const started = Date.parse(job.created_at ?? "") || Date.now();
  const [now, setNow] = useState(started);

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setNow(Date.now()), 100);
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const { status } = await request<Pick<ParsingJob, "status">>(
        `/api/parse/${job.id}`
      ).catch(() => job);
      if (stopped) return;
      if (isRunning(status)) timer = setTimeout(poll, POLL_MS);
      else router.refresh();
    };
    timer = setTimeout(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [job, running, router]);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center motion-safe:animate-rise">
        {running ? (
          <>
            <ToastMark live />
            <p className="text-sm font-medium">
              <span className="text-shimmer motion-safe:animate-shimmer">
                {job.status === "pending" ? "Queued" : "Parsing"}
              </span>{" "}
              <span className="text-muted-foreground">{job.filename}</span>
            </p>
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {((now - started) / 1000).toFixed(1)}s
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">
              {job.status === "cancelled"
                ? "This parse was cancelled."
                : "This document couldn't be parsed."}
            </p>
            <p className="text-xs text-muted-foreground">{failureOf(job)}</p>
            <Link
              href="/parse"
              className={cn(
                "rounded-sm text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground",
                FOCUS
              )}
            >
              Parse another document
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function failureOf(job: ParsingJob): string {
  const message = job.error?.message;
  return typeof message === "string" ? message : (job.filename ?? "");
}
