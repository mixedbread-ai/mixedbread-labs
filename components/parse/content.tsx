"use client";

import "katex/dist/katex.min.css";

import type { ReturnFormat } from "@mixedbread/sdk/resources/parsing/jobs";
import { createMathPlugin } from "@streamdown/math";
import { memo, useMemo } from "react";
import { Streamdown } from "streamdown";
import { COMPONENTS } from "@/components/markdown";
import { prepareMarkdown } from "@/lib/markdown";

// The parser writes inline math between single dollars
const plugins = { math: createMathPlugin({ singleDollarTextMath: true }) };

/**
 * Parsed content as it reads: Markdown, or HTML, which Streamdown sanitizes
 * the same way. Plain text callers show as it is.
 */
export const ParsedContent = memo(function ParsedContent({
  content,
  format,
}: {
  content: string;
  format: Exclude<ReturnFormat, "plain">;
}) {
  const source = useMemo(
    () => (format === "markdown" ? prepareMarkdown(content) : content),
    [content, format]
  );

  return (
    <Streamdown
      mode="static"
      plugins={plugins}
      components={COMPONENTS}
      parseIncompleteMarkdown={false}
      controls={false}
      // Cell text comes wrapped in paragraphs, which the cell spaces itself;
      // an equation wider than the pane scrolls on its own
      className="text-sm leading-6 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 [&_:is(td,th)>p]:mb-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    >
      {source}
    </Streamdown>
  );
});
