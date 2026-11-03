"use client";

import { Tabs } from "@base-ui/react/tabs";
import { cn } from "cn";
import { FileSearchIcon, MessageCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOCUS, SEGMENT, SegmentList } from "./controls";

const SITE = "https://www.mixedbread.com";

const TOOLS = [
  { href: "/parse", label: "Parse", Icon: FileSearchIcon },
  { href: "/chat", label: "Chat", Icon: MessageCircleIcon },
];

/** The marketing site's header, with the tools in the playground's switch */
export function Header() {
  const pathname = usePathname();
  const tool = TOOLS.find(({ href }) => pathname.startsWith(href))?.href;

  return (
    <header className="mx-auto grid h-16 w-[67.5rem] max-w-[94vw] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2 justify-self-start rounded-sm",
          FOCUS
        )}
      >
        <Image src="/mixedbread.svg" alt="" width={24} height={13} />
        <span className="text-sm font-medium max-xs:sr-only">Mixedbread</span>
        <span className="text-[13px] font-medium text-orange-700 dark:text-logo">
          Labs
        </span>
      </Link>

      <Tabs.Root value={tool ?? null}>
        <SegmentList aria-label="Tools" activateOnFocus={false}>
          {TOOLS.map(({ href, label, Icon }) => (
            <Tabs.Tab
              key={href}
              value={href}
              nativeButton={false}
              render={<Link href={href} />}
              className={SEGMENT}
            >
              <Icon className="size-3.5" />
              {label}
            </Tabs.Tab>
          ))}
        </SegmentList>
      </Tabs.Root>

      <a
        href={`${SITE}/docs`}
        className="flex h-8 items-center justify-self-end rounded-md px-3 text-sm text-foreground/80 transition-[background-color,color] hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Docs
      </a>
    </header>
  );
}
