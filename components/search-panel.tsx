"use client";

import { cn } from "cn";
import { useRef, useState } from "react";
import type { DocHit, DocSearchResponse } from "@/lib/chat";
import { COLUMN, Failure } from "./controls";
import { PageCard } from "./page-card";

type Status = "idle" | "loading" | "error";

interface Result {
  /** Counts searches, so each result set mounts, and rises, anew */
  id: number;
  response: DocSearchResponse;
}

export type Search = ReturnType<typeof useSearch>;

export function useSearch(store: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [query, setQuery] = useState("");
  const request = useRef<AbortController | null>(null);

  async function run(text: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setQuery(text);
    setStatus("loading");

    try {
      const response = await fetch(
        `/api/chats/${store}/search?${new URLSearchParams({ query: text })}`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data: DocSearchResponse = await response.json();
      setResult((previous) => ({
        id: (previous?.id ?? 0) + 1,
        response: data,
      }));
      setStatus("idle");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }

  return { result, status, run, retry: () => run(query) };
}

/** Results scroll above the composer; nothing renders until the first search */
export function SearchPanel({ search }: { search: Search }) {
  const { result, status } = search;

  if (status === "error") {
    return (
      <div className="flex h-full items-center justify-center">
        <Failure
          message="The search failed."
          onRetry={() => void search.retry()}
        />
      </div>
    );
  }

  if (!result) return status === "loading" ? <Skeleton /> : null;

  return (
    // Keyed by search, so a new one starts at the top and rises in. The page
    // frames move the results themselves, so the browser's anchoring stays out.
    <div
      key={result.id}
      data-results
      className={cn(
        "h-full overflow-y-auto overscroll-contain fade-y pt-6 pb-8 transition-[opacity] duration-200 [overflow-anchor:none]",
        status === "loading" && "opacity-50"
      )}
    >
      <div className={COLUMN}>
        <Hits response={result.response} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <ol aria-hidden="true" className={cn(COLUMN, "flex flex-col pt-11")}>
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex gap-4 p-3">
          <span className="h-16 w-12 shrink-0 animate-pulse rounded-md bg-soft" />
          <span className="flex flex-1 flex-col gap-2.5 pt-1">
            <span className="h-3 w-24 animate-pulse rounded bg-soft" />
            <span className="h-3 w-full animate-pulse rounded bg-soft" />
            <span className="h-3 w-2/3 animate-pulse rounded bg-soft" />
          </span>
        </li>
      ))}
    </ol>
  );
}

function Hits({ response }: { response: DocSearchResponse }) {
  if (response.hits.length === 0) {
    return (
      <p className="pt-10 text-center text-[13px] text-muted-foreground motion-safe:animate-swap-in">
        Nothing in these documents matches that.
      </p>
    );
  }

  const top = response.hits[0]?.score || 1;
  return (
    <>
      <p className="mb-1 px-3 font-mono text-[11px] text-muted-foreground tabular-nums motion-safe:animate-swap-in">
        {response.hits.length} results in {response.ms} ms
      </p>
      <ol className="flex flex-col">
        {response.hits.map((hit, index) => (
          <Hit
            key={hit.id}
            hit={hit}
            rank={index + 1}
            relevance={hit.score / top}
          />
        ))}
      </ol>
    </>
  );
}

function Hit({
  hit,
  rank,
  relevance,
}: {
  hit: DocHit;
  rank: number;
  relevance: number;
}) {
  return (
    <PageCard
      page={hit}
      delay={(rank - 1) * 40}
      meta={
        <>
          <span className="h-1 w-12 overflow-hidden rounded-full bg-soft max-sm:hidden">
            <span
              className="block h-full origin-left rounded-full bg-logo/70"
              style={{ transform: `scaleX(${relevance})` }}
            />
          </span>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {hit.score.toFixed(2)}
          </span>
        </>
      }
    />
  );
}
