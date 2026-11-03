"use client";

import { cn } from "cn";
import { CheckIcon, LinkIcon } from "lucide-react";
import { useCopy } from "@/lib/clipboard";
import { BUTTON } from "./controls";
import { IconSwap } from "./ui/icon-swap";

/** Copies this page's address: anyone with it sees the same result */
export function ShareButton() {
  const [copied, copy] = useCopy();

  return (
    <button
      type="button"
      onClick={() => copy(location.href)}
      // Only the icon on phones, where the header has room for little else
      className={cn(BUTTON, "max-sm:w-8 max-sm:px-0")}
    >
      <IconSwap
        state={copied ? "b" : "a"}
        a={<LinkIcon className="size-3.5" />}
        b={<CheckIcon className="size-3.5" />}
      />
      <span className="max-sm:sr-only">{copied ? "Copied" : "Share"}</span>
    </button>
  );
}
