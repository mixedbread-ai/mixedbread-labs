"use client";

import { cn } from "cn";
import { CheckIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { BUTTON } from "./controls";
import { IconSwap } from "./ui/icon-swap";

/** Copies this page's address: anyone with it sees the same result */
export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(location.href).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={cn(BUTTON, className)}
    >
      <IconSwap
        state={copied ? "b" : "a"}
        a={<LinkIcon className="size-3.5" />}
        b={<CheckIcon className="size-3.5" />}
      />
      {copied ? "Copied" : "Share"}
    </button>
  );
}
