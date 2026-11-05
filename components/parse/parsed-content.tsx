"use client";

import dynamic from "next/dynamic";
import { Bone } from "@/components/skeleton";

/**
 * The Markdown and math renderer loads after the result page, whose pages and
 * bones show without it
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
