"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";

/** Streamdown with the playground's spacing; its elements come from `COMPONENTS` */
export function Response({
  className,
  ...props
}: ComponentProps<typeof Streamdown>) {
  return (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      parseIncompleteMarkdown={false}
      {...props}
    />
  );
}
