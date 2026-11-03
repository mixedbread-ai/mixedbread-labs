"use client";

import dynamic from "next/dynamic";
import { Bone } from "@/components/skeleton";

/**
 * The Markdown and math renderer loads when parsed content first shows, not
 * with the result page: the element list is all of the page until a row is
 * picked or the text is opened
 */
export const ParsedContent = dynamic(
  () => import("./content").then((module) => module.ParsedContent),
  {
    ssr: false,
    loading: () => (
      <span className="flex flex-col gap-2 py-1">
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-4/5" />
      </span>
    ),
  }
);

/** Starts loading the renderer, so it is there by the time it shows */
export function preloadParsedContent() {
  void import("./content");
}
