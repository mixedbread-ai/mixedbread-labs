"use client";

import { useEffect } from "react";
import { Failure } from "@/components/controls";
import { PageHeader } from "@/components/shell/shell";

/** A page that failed to load, such as when the API is down; trying again loads it anew */
export default function PageError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader />
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-12">
        <Failure message="This page couldn't load." onRetry={retry} />
      </div>
    </>
  );
}
