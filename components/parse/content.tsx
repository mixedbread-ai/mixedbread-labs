"use client";

import "katex/dist/katex.min.css";

import { createMathPlugin } from "@streamdown/math";
import { cn } from "cn";
import { memo } from "react";
import { Streamdown } from "streamdown";
import { COMPONENTS } from "@/components/markdown";

// The parser writes inline math between single dollars
const plugins = { math: createMathPlugin({ singleDollarTextMath: true }) };

/**
 * Parsed content as it reads: Markdown, or HTML, which Streamdown sanitizes
 * the same way; plain text stays as it is
 */
export const ParsedContent = memo(function ParsedContent({
  content,
  plain = false,
  className,
}: {
  content: string;
  plain?: boolean;
  className?: string;
}) {
  if (plain) {
    return (
      <p className={cn("text-sm leading-6 whitespace-pre-wrap", className)}>
        {content}
      </p>
    );
  }
  return (
    <Streamdown
      mode="static"
      plugins={plugins}
      components={COMPONENTS}
      parseIncompleteMarkdown={false}
      controls={false}
      className={cn(
        "text-sm leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
    >
      {content}
    </Streamdown>
  );
});
