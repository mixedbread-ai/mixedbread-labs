"use client";

import { useParams } from "next/navigation";
import { ParsePending } from "@/components/parse/pending";
import { PageHeader } from "@/components/shell/shell";
import { Bone } from "@/components/skeleton";
import { startedJob } from "@/lib/start-parse";

const LINES = ["w-full", "w-full", "w-11/12", "w-full", "w-2/3"];
const PARAGRAPHS = 4;

/**
 * A job this tab just started shows queued, as its page will; any other link
 * shows the result's bones
 */
export default function Loading() {
  const job = startedJob(useParams<{ job: string }>().job);
  return job ? <ParsePending job={job} /> : <ResultBones />;
}

/**
 * The parse view while its result loads, laid out as the view is: the header
 * and its actions, the page in its well, and the inspector's tabs, bar and
 * text on the same sizes as the real ones
 */
function ResultBones() {
  return (
    <>
      <PageHeader
        title={<Bone className="h-3.5 w-48" />}
        actions={
          <>
            <Bone className="h-8 w-[7.75rem] rounded-lg" />
            <Bone className="h-8 w-[5.25rem] rounded-lg" />
          </>
        }
      />
      <div className="grid min-h-0 flex-1 gap-3 px-2 pb-2 md:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] md:px-3 md:pb-3 xl:grid-cols-[minmax(0,1fr)_32rem]">
        <div className="flex min-h-0 justify-center overflow-hidden rounded-xl bg-background px-4 pt-6 sm:px-10">
          <Bone className="aspect-[8.5/11] w-full max-w-[820px] rounded-[3px]" />
        </div>
        <div className="flex min-h-0 flex-col max-md:hidden">
          {/* The tabs' track: p-0.5 around segments of py-1 and 13px text */}
          <Bone className="h-[2.0625rem] shrink-0 rounded-full" />
          <div className="mt-2 flex h-10 shrink-0 items-center justify-between px-1">
            <Bone className="h-7 w-[8.625rem] rounded-full" />
            <Bone className="h-7 w-[9.875rem] rounded-md" />
          </div>
          <div className="flex min-h-0 flex-col gap-4 overflow-hidden px-1 py-4">
            <Bone className="h-3 w-10" />
            {Array.from({ length: PARAGRAPHS }, (_, paragraph) => (
              <div key={paragraph} className="flex flex-col gap-2.5">
                {LINES.map((width, line) => (
                  <Bone key={line} className={`h-3.5 ${width}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
