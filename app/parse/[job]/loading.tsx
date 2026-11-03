"use client";

import { useParams } from "next/navigation";
import { ParsePending } from "@/components/parse/pending";
import { PageHeader } from "@/components/shell/shell";
import { Bone } from "@/components/skeleton";
import { startedJob } from "@/lib/parse";

const ROWS = 14;

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
 * and its actions, the page in its well, and the inspector's tabs, filter and
 * rows on the same grid as the real ones
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
          <div className="flex shrink-0 items-center gap-1 pt-3 pb-2">
            <Bone className="h-8 flex-1 rounded-lg" />
            <Bone className="h-8 w-24 rounded-full" />
          </div>
          {Array.from({ length: ROWS }, (_, index) => (
            // A row's grid and type sizes, each cell holding a line's height
            <div
              key={index}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)_1.75rem] items-center gap-3 px-2.5 py-1.5"
            >
              <span className="flex items-center gap-2 text-xs">
                <Bone className="size-2" />
                <Bone className="h-3 w-14" />
                &nbsp;
              </span>
              <span className="flex items-center text-[13px]">
                <Bone className="h-3.5 w-full" />
                &nbsp;
              </span>
              <span className="flex items-center justify-end text-[11px]">
                <Bone className="h-3 w-3" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
