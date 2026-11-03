import { useEffect, useSyncExternalStore } from "react";

/** A parse or chat this browser opened, so it can find its way back without an account */
export interface HistoryEntry {
  kind: "parse" | "chat";
  href: string;
  title: string;
  detail: string;
}

// Checked by hand rather than with a schema library, which would ship on every page
function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry: Partial<Record<keyof HistoryEntry, unknown>> = value;
  return (
    (entry.kind === "parse" || entry.kind === "chat") &&
    typeof entry.href === "string" &&
    typeof entry.title === "string" &&
    typeof entry.detail === "string"
  );
}

const KEY = "labs:history";
const MAX_ENTRIES = 50;
const EMPTY: HistoryEntry[] = [];

let cache: HistoryEntry[] | null = null;
const listeners = new Set<() => void>();

function read(): HistoryEntry[] {
  if (cache) return cache;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(stored) && stored.every(isEntry) ? stored : EMPTY;
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

/** Puts an entry first, replacing an earlier visit to the same link */
/**
 * Adds a new entry on top. One already listed keeps its place, so the list
 * doesn't move under the pointer that just opened it.
 */
function remember(entry: HistoryEntry) {
  const entries = read();
  const known = entries.find(({ href }) => href === entry.href);
  if (known?.title === entry.title && known.detail === entry.detail) return;
  const next = known
    ? entries.map((item) => (item === known ? entry : item))
    : [entry, ...entries].slice(0, MAX_ENTRIES);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows may refuse storage; the list then lasts the visit
  }
  for (const listener of listeners) listener();
}

/** Records this page in the history once its title is known */
export function useRemember(entry: HistoryEntry) {
  const { kind, href, title, detail } = entry;
  useEffect(() => {
    remember({ kind, href, title, detail });
  }, [kind, href, title, detail]);
}

export function useHistory(kind: HistoryEntry["kind"]): HistoryEntry[] {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  return all.filter((entry) => entry.kind === kind);
}
