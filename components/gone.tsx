"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { HEADLINE, PRIMARY } from "@/components/controls";
import { PageHeader } from "@/components/shell/shell";
import { forget } from "@/lib/history";

const COPY = {
  parse: {
    header: "Parse",
    lasts: "A parse lasts a week after its upload",
    action: "Parse a document",
    href: "/parse",
  },
  chat: {
    header: "Chat",
    lasts: "A chat lasts 30 days after it was last used",
    action: "Start a chat",
    href: "/chat",
  },
} as const;

/**
 * A parse or chat the API no longer has: it expired or was deleted. Its
 * sidebar entry would only lead back here, so it goes.
 */
export function Gone({ kind }: { kind: "parse" | "chat" }) {
  const pathname = usePathname();
  const copy = COPY[kind];

  useEffect(() => {
    forget(pathname);
  }, [pathname]);

  return (
    <>
      <PageHeader title={copy.header} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pb-12 text-center">
        <h1 className={cn(HEADLINE, "motion-safe:animate-rise")}>
          This {kind} is gone
        </h1>
        <p
          className="max-w-sm text-sm leading-6 text-balance text-muted-foreground motion-safe:animate-rise"
          style={{ animationDelay: "40ms" }}
        >
          {copy.lasts}, unless whoever made it deletes it sooner. It&apos;s off
          your sidebar now.
        </p>
        <Link
          href={copy.href}
          className={cn(PRIMARY, "mt-2 motion-safe:animate-rise")}
          style={{ animationDelay: "80ms" }}
        >
          {copy.action}
        </Link>
      </div>
    </>
  );
}
