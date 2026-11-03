"use client";

import { Drawer } from "@base-ui/react/drawer";
import { cn } from "cn";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  FileSearchIcon,
  type LucideIcon,
  MessageCirclePlusIcon,
  MoonIcon,
  PanelLeftIcon,
  SunIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { FOCUS, GHOST_ICON } from "@/components/controls";
import { HoverArea } from "@/components/ui/hover-area";
import { type HistoryEntry, useHistory } from "@/lib/history";

const drawer = Drawer.createHandle();

const ROW = cn(
  "relative flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[13.5px] text-foreground/80 transition-[color,background-color] duration-150 hover:text-foreground aria-[current=page]:bg-[oklch(from_var(--foreground)_l_c_h/0.075)] aria-[current=page]:text-foreground [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
  FOCUS
);

/** Bread Chat's frame: the sidebar on the page, each tool in a raised panel beside it */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh min-h-128 overflow-hidden bg-background">
      <aside
        aria-label="Sidebar"
        className="hidden w-60 shrink-0 flex-col md:flex"
      >
        <SidebarContent />
      </aside>
      <Drawer.Root handle={drawer} swipeDirection="left">
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/25 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-450 ease-drawer data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 dark:bg-black/55" />
          <Drawer.Viewport className="fixed inset-0 z-50 flex">
            <Drawer.Popup className="flex h-full w-[min(17rem,85vw)] [transform:translateX(var(--drawer-swipe-movement-x))] flex-col bg-background shadow-float transition-transform duration-450 ease-drawer outline-none data-ending-style:[transform:translateX(-100%)] data-starting-style:[transform:translateX(-100%)] data-swiping:select-none motion-reduce:transition-none">
              <Drawer.Title className="sr-only">Labs</Drawer.Title>
              <SidebarContent />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <main className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-panel md:rounded-2xl md:shadow-raised md:ring-1 md:ring-soft">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const parses = useHistory("parse");
  const chats = useHistory("chat");

  return (
    <>
      <div className="flex h-13 shrink-0 items-center px-3">
        <Link
          href="/"
          onClick={() => drawer.close()}
          className={cn(
            "flex items-center gap-2 rounded-md px-1 py-0.5 text-sm font-medium",
            FOCUS
          )}
        >
          <Image src="/mixedbread.svg" alt="" width={22} height={12} />
          Mixedbread
          <span className="text-orange-700 dark:text-logo">Labs</span>
        </Link>
      </div>

      <nav aria-label="Tools" className="px-2 pb-1">
        <HoverArea className="flex flex-col gap-px">
          <NavRow href="/parse" Icon={FileSearchIcon} pathname={pathname}>
            Parse a document
          </NavRow>
          <NavRow href="/chat" Icon={MessageCirclePlusIcon} pathname={pathname}>
            New chat
          </NavRow>
        </HoverArea>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
        <History label="Parses" entries={parses} pathname={pathname} />
        <History label="Chats" entries={chats} pathname={pathname} />
        {parses.length + chats.length === 0 && (
          <p className="px-2 pt-4 text-xs leading-5 text-muted-foreground/80">
            Parses and chats you open show here, in this browser.
          </p>
        )}
      </div>

      <HoverArea className="flex shrink-0 flex-col gap-px p-2">
        <a
          data-row=""
          href="https://www.mixedbread.com/docs"
          target="_blank"
          rel="noopener"
          className={cn(ROW, "group/docs")}
        >
          <BookOpenIcon />
          Docs
          <ArrowUpRightIcon className="ml-auto size-3.5! opacity-0 transition-opacity group-hover/docs:opacity-100" />
        </a>
        <ThemeRow />
      </HoverArea>
    </>
  );
}

function NavRow({
  href,
  Icon,
  pathname,
  children,
}: {
  href: string;
  Icon: LucideIcon;
  pathname: string;
  children: ReactNode;
}) {
  return (
    <Link
      data-row=""
      href={href}
      onClick={() => drawer.close()}
      aria-current={pathname === href ? "page" : undefined}
      className={ROW}
    >
      <Icon />
      {children}
    </Link>
  );
}

function History({
  label,
  entries,
  pathname,
}: {
  label: string;
  entries: HistoryEntry[];
  pathname: string;
}) {
  if (entries.length === 0) return null;

  return (
    <section className="pt-4">
      <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground/80">
        {label}
      </h2>
      <HoverArea>
        <ul className="flex flex-col gap-px">
          {entries.map((entry) => (
            <li key={entry.href} data-row="" className="relative">
              <Link
                href={entry.href}
                title={`${entry.title}\n${entry.detail}`}
                onClick={() => drawer.close()}
                aria-current={
                  pathname === entry.href.split("?")[0] ? "page" : undefined
                }
                className={cn(ROW, "text-foreground/70")}
              >
                <span className="min-w-0 flex-1 overflow-hidden mask-r-from-[calc(100%-1.5rem)] whitespace-nowrap">
                  {entry.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </HoverArea>
    </section>
  );
}

function ThemeRow() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      data-row=""
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={ROW}
    >
      <SunIcon className="dark:hidden" />
      <MoonIcon className="not-dark:hidden" />
      <span className="dark:hidden">Light theme</span>
      <span className="not-dark:hidden">Dark theme</span>
    </button>
  );
}

/** A tool's top bar, borderless like Bread Chat's; on phones it opens the sidebar */
export function PageHeader({
  title,
  actions,
}: {
  title?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-1 px-2 md:px-3">
      <Drawer.Trigger
        handle={drawer}
        aria-label="Open sidebar"
        className={cn(GHOST_ICON, "md:hidden")}
      >
        <PanelLeftIcon />
      </Drawer.Trigger>
      <div className="flex min-w-0 items-center gap-2 px-1.5 text-[13.5px] text-muted-foreground">
        {title}
      </div>
      {actions && (
        <div className="ml-auto flex shrink-0 items-center gap-1.5 motion-safe:animate-swap-in">
          {actions}
        </div>
      )}
    </header>
  );
}
