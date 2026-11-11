"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Drawer } from "@base-ui/react/drawer";
import { Menu } from "@base-ui/react/menu";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "cn";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckIcon,
  EllipsisIcon,
  FileSearchIcon,
  LinkIcon,
  type LucideIcon,
  MessageCirclePlusIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  BUTTON,
  FOCUS,
  GHOST_ICON,
  POPUP,
  POPUP_ITEM,
} from "@/components/controls";
import { HoverArea } from "@/components/ui/hover-area";
import { IconSwap } from "@/components/ui/icon-swap";
import { useCopy } from "@/lib/clipboard";
import {
  dropGone,
  forget,
  type HistoryEntry,
  idOf,
  pageOf,
  useHistory,
} from "@/lib/history";
import { errorMessage, OWNER_HEADER, request } from "@/lib/request";

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
  // Rows whose parse or chat is gone leave once the server says so
  useEffect(() => {
    void dropGone();
  }, []);
  // The entry the dialog asks about stays while it closes
  const [deleting, setDeleting] = useState<HistoryEntry>();
  const [confirming, setConfirming] = useState(false);
  const onDelete = (entry: HistoryEntry) => {
    setDeleting(entry);
    setConfirming(true);
  };

  return (
    <>
      {/* Centered on the panel header, which starts below the panel's margin */}
      <div className="mt-2 flex h-12 shrink-0 items-center px-3">
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
          <NavRow href="/chat" Icon={MessageCirclePlusIcon} pathname={pathname}>
            New chat
          </NavRow>
          <NavRow href="/parse" Icon={FileSearchIcon} pathname={pathname}>
            Parse a document
          </NavRow>
        </HoverArea>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
        <History
          label="Parses"
          entries={parses}
          pathname={pathname}
          onDelete={onDelete}
        />
        <History
          label="Chats"
          entries={chats}
          pathname={pathname}
          onDelete={onDelete}
        />
        {parses.length + chats.length === 0 && (
          <p className="px-2 pt-4 text-xs leading-5 text-muted-foreground/80">
            Parses and chats you open show here, in this browser.
          </p>
        )}
      </div>

      {/* One row, as Bread Chat ends its sidebar: a way out, and the theme */}
      <div className="flex shrink-0 items-center gap-2 p-2">
        <a
          href="https://www.mixedbread.com/docs"
          target="_blank"
          rel="noopener"
          className={cn(ROW, "group/docs min-w-0 flex-1 hover:bg-soft")}
        >
          <BookOpenIcon />
          Docs
          <ArrowUpRightIcon className="size-3.5! opacity-0 transition-opacity group-hover/docs:opacity-60" />
        </a>
        <ThemeSwitch />
      </div>

      <DeleteDialog
        entry={deleting}
        open={confirming}
        onOpenChange={setConfirming}
      />
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
  onDelete,
}: {
  label: string;
  entries: HistoryEntry[];
  pathname: string;
  onDelete: (entry: HistoryEntry) => void;
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
            // The button shows on hover, keyboard focus, an open menu, or a
            // touch screen; --row-clear moves the title's fade out of its way.
            // An open menu keeps its row lit, as the pointer leaves for it.
            <li
              key={entry.href}
              data-row=""
              className="group/row relative rounded-lg transition-[--row-clear,background-color] duration-200 ease-smooth hover:[--row-clear:1.5rem] has-focus-visible:[--row-clear:1.5rem] has-data-popup-open:[--row-clear:1.5rem] has-data-popup-open:not-hover:bg-[oklch(from_var(--foreground)_l_c_h/0.055)] motion-reduce:transition-none [@media(hover:none)]:[--row-clear:1.5rem]"
            >
              <Link
                href={entry.href}
                title={`${entry.title}\n${entry.detail}`}
                onClick={() => drawer.close()}
                aria-current={
                  pathname === pageOf(entry.href) ? "page" : undefined
                }
                className={cn(ROW, "text-foreground/70")}
              >
                {/* Fades out before the menu button wherever it shows */}
                <span className="min-w-0 flex-1 overflow-hidden row-fade whitespace-nowrap">
                  {entry.title}
                </span>
              </Link>
              <RowMenu entry={entry} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      </HoverArea>
    </section>
  );
}

/**
 * A row's menu: its link to copy, so it can be shared without opening it,
 * and, for the browser that made it, delete
 */
function RowMenu({
  entry,
  onDelete,
}: {
  entry: HistoryEntry;
  onDelete: (entry: HistoryEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, copy] = useCopy();

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        aria-label={`More for ${entry.title}`}
        className={cn(
          // Slides in with the title's fade, on the same curve; keyboard focus
          // shows it, focus handed back by a closed menu doesn't
          "absolute top-1/2 right-1 flex size-6 translate-x-1 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-[opacity,translate,color,background-color] duration-200 ease-smooth group-hover/row:translate-x-0 group-hover/row:opacity-100 group-has-focus-visible/row:translate-x-0 group-has-focus-visible/row:opacity-100 hover:bg-soft hover:text-foreground data-popup-open:translate-x-0 data-popup-open:bg-soft data-popup-open:text-foreground data-popup-open:opacity-100 motion-reduce:transition-none [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100",
          FOCUS
        )}
      >
        <EllipsisIcon className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={4}
          className="z-50"
        >
          <Menu.Popup className={cn(POPUP, "w-44")}>
            {/* Stays open a moment to show the link was copied */}
            <Menu.Item
              closeOnClick={false}
              onClick={() =>
                copy(new URL(entry.href, location.origin).href).then(
                  () => setTimeout(() => setOpen(false), 700),
                  () => {}
                )
              }
              className={POPUP_ITEM}
            >
              <IconSwap
                state={copied ? "b" : "a"}
                a={<LinkIcon className="size-4 text-muted-foreground" />}
                b={<CheckIcon className="size-4 text-muted-foreground" />}
              />
              {copied ? "Copied" : "Copy link"}
            </Menu.Item>
            {/* Only the browser that made it holds the token to delete it */}
            {entry.token && (
              <Menu.Item
                onClick={() => onDelete(entry)}
                className={cn(
                  POPUP_ITEM,
                  "text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
                )}
              >
                <Trash2Icon className="size-4" />
                Delete
              </Menu.Item>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Where a delete goes: the API route behind the entry's page */
function apiPathOf({ kind, href }: HistoryEntry): string {
  const id = idOf(href);
  return kind === "chat" ? `/api/chats/${id}` : `/api/parse/${id}`;
}

/**
 * Asks before deleting a chat or parse, as it goes for everyone with the
 * link; then leaves its page if it was open
 */
function DeleteDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: HistoryEntry | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const noun = entry?.kind === "chat" ? "chat" : "parse";

  async function confirm() {
    if (!entry?.token) return;
    setPending(true);
    setError(undefined);
    try {
      await request(apiPathOf(entry), {
        method: "DELETE",
        headers: { [OWNER_HEADER]: entry.token },
      });
      forget(entry.href);
      onOpenChange(false);
      if (pathname === pageOf(entry.href)) {
        drawer.close();
        router.push(entry.kind === "chat" ? "/chat" : "/parse");
      }
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) setError(undefined);
        onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/25 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none dark:bg-black/55" />
        <AlertDialog.Popup
          className={cn(
            POPUP,
            "fixed top-1/2 left-1/2 z-50 flex w-[min(22rem,calc(100vw-2rem))] -translate-1/2 flex-col gap-4 rounded-2xl p-5"
          )}
        >
          <div className="flex flex-col gap-1.5">
            <AlertDialog.Title className="text-[15px] font-medium">
              Delete this {noun}?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-[13px] leading-5 text-muted-foreground">
              <span className="font-medium break-words text-foreground">
                {entry?.title}
              </span>{" "}
              stops working for everyone with the link. This can&apos;t be
              undone.
            </AlertDialog.Description>
          </div>
          {error && (
            <p className="text-[13px] text-destructive motion-safe:animate-swap-in">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <AlertDialog.Close disabled={pending} className={BUTTON}>
              Cancel
            </AlertDialog.Close>
            <button
              type="button"
              disabled={pending}
              onClick={() => void confirm()}
              className={cn(
                BUTTON,
                "bg-destructive text-white ring-0 hover:bg-destructive/90"
              )}
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

const noop = () => () => {};

const THEMES = [
  { value: "system", label: "System", Icon: MonitorIcon, turn: "0deg" },
  { value: "light", label: "Light", Icon: SunIcon, turn: "-90deg" },
  { value: "dark", label: "Dark", Icon: MoonIcon, turn: "40deg" },
] as const;

/** Bread Chat's theme switch: three icons on a track, the picked one raised */
function ThemeSwitch() {
  const { theme: stored, setTheme } = useTheme();
  // The saved theme is the browser's alone, so the server renders none
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
  const theme = mounted ? stored : undefined;
  // Icons turn when picked here, not on the first paint
  const [picked, setPicked] = useState(false);
  const index = THEMES.findIndex(({ value }) => value === theme);

  return (
    <ToggleGroup
      aria-label="Theme"
      value={theme ? [theme] : []}
      onValueChange={([next]) => {
        if (!next) return;
        setPicked(true);
        setTheme(next);
      }}
      className="relative flex shrink-0 rounded-full bg-soft p-0.5"
    >
      {index >= 0 && (
        <span
          aria-hidden="true"
          style={{ translate: `${index * 100}% 0` }}
          className="absolute top-0.5 left-0.5 size-7 rounded-full bg-popover shadow-raised transition-[translate] duration-300 ease-smooth motion-reduce:transition-none"
        />
      )}
      {THEMES.map(({ value, label, Icon, turn }) => (
        <Toggle
          key={value}
          value={value}
          aria-label={label}
          style={{ "--turn": turn } as CSSProperties}
          className={cn(
            "group/theme relative flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:text-foreground data-pressed:text-foreground",
            FOCUS
          )}
        >
          <Icon
            className={cn(
              "size-3.5",
              picked &&
                "group-data-pressed/theme:motion-safe:animate-theme-turn"
            )}
          />
        </Toggle>
      ))}
    </ToggleGroup>
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
      <div className="flex min-w-0 items-center gap-2 px-1 text-[13.5px] text-muted-foreground md:px-0">
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
