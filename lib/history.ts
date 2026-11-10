import { useEffect, useSyncExternalStore } from "react";
import { postJson } from "./request";

/** A parse or chat this browser opened, so it can find its way back without an account */
export interface HistoryEntry {
  kind: "parse" | "chat";
  href: string;
  title: string;
  detail: string;
  /** Kept by the browser that made it, which alone can delete it */
  token?: string;
}

// Checked by hand rather than with a schema library, which would ship on every page
function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry: Partial<Record<keyof HistoryEntry, unknown>> = value;
  return (
    (entry.kind === "parse" || entry.kind === "chat") &&
    typeof entry.href === "string" &&
    typeof entry.title === "string" &&
    typeof entry.detail === "string" &&
    (entry.token === undefined || typeof entry.token === "string")
  );
}

const KEY = "labs:history";
const MAX_ENTRIES = 50;
const EMPTY: HistoryEntry[] = [];

let cache: HistoryEntry[] | null = null;

/** The first entry of each page: lists saved before entries matched by page can hold two */
function onePerPage(entries: HistoryEntry[]): HistoryEntry[] {
  const seen = new Set<string>();
  return entries.filter(({ href }) => {
    const page = pageOf(href);
    if (seen.has(page)) return false;
    seen.add(page);
    return true;
  });
}
const listeners = new Set<() => void>();

function read(): HistoryEntry[] {
  if (cache) return cache;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache =
      Array.isArray(stored) && stored.every(isEntry)
        ? onePerPage(stored)
        : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = null;
    listener();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    removeEventListener("storage", onStorage);
  };
}

/**
 * The page an entry links to, without its query: a parse opened with another
 * `?mode` is the same parse, so it keeps one row
 */
export function pageOf(href: string): string {
  return href.split("?")[0] ?? href;
}

function write(next: HistoryEntry[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows may refuse storage; the list then lasts the visit
  }
  for (const listener of listeners) listener();
}

/**
 * Adds a new entry on top. One already listed keeps its place, so the list
 * doesn't move under the pointer that just opened it, and its token.
 */
export function remember(entry: HistoryEntry) {
  const entries = read();
  const page = pageOf(entry.href);
  const known = entries.find(({ href }) => pageOf(href) === page);
  const token = entry.token ?? known?.token;
  if (
    known?.href === entry.href &&
    known.title === entry.title &&
    known.detail === entry.detail &&
    known.token === token
  ) {
    return;
  }
  const next = { ...entry, token };
  write(
    known
      ? entries.map((item) => (item === known ? next : item))
      : [next, ...entries].slice(0, MAX_ENTRIES)
  );
}

/** Takes a page's entries off the list, once what they link to is gone */
export function forget(href: string) {
  const page = pageOf(href);
  const entries = read();
  const next = entries.filter((entry) => pageOf(entry.href) !== page);
  if (next.length !== entries.length) write(next);
}

/** Records this page in the history once its title is known */
export function useRemember(entry: HistoryEntry) {
  const { kind, href, title, detail } = entry;
  useEffect(() => {
    remember({ kind, href, title, detail });
  }, [kind, href, title, detail]);
}

/** A parse's job id or a chat's store id, the last part of its page */
export function idOf(href: string): string {
  return pageOf(href).split("/").pop() ?? "";
}

const CHECKED_KEY = "labs:history-checked";

/**
 * How often the entries are checked. Each is a call on the one key every
 * visitor shares, and a parse's carries its whole result, while entries
 * expire by the day; one opened in between that's gone says so and leaves.
 */
const CHECK_EVERY = 60 * 60 * 1000;

let checking = false;

/**
 * Asks the server which entries the API no longer has, at most once an hour,
 * and drops them: expired, or deleted here, elsewhere or by whoever made
 * them. The list shows meanwhile, as one is rarely gone. A failed check
 * drops nothing and runs again on the next page load.
 */
export async function dropGone() {
  if (checking) return;
  checking = true;
  const entries = read();
  if (entries.length === 0) return;
  try {
    const last = Number(localStorage.getItem(CHECKED_KEY));
    if (Date.now() - last < CHECK_EVERY) return;
  } catch {
    // Without storage the list lasts the visit, so it needs no check
    return;
  }
  const result = await postJson<{ gone: string[] }>("/api/history", {
    entries: entries.map(({ kind, href }) => ({ kind, id: idOf(href) })),
  }).catch(() => null);
  if (!result) return;
  try {
    localStorage.setItem(CHECKED_KEY, String(Date.now()));
  } catch {
    // Checked again next load, which is only a little waste
  }
  const { gone } = result;
  if (gone.length === 0) return;
  const dead = new Set(gone);
  // The list may have changed while the check ran, so it's read again
  const current = read();
  const next = current.filter(({ href }) => !dead.has(idOf(href)));
  if (next.length !== current.length) write(next);
}

export function useHistory(kind: HistoryEntry["kind"]): HistoryEntry[] {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  return all.filter((entry) => entry.kind === kind);
}
