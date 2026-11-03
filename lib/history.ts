import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";

/** A parse or chat this browser opened, so it can find its way back without an account */
const EntrySchema = z.object({
  kind: z.enum(["parse", "chat"]),
  href: z.string(),
  title: z.string(),
  detail: z.string(),
  at: z.number(),
});

export type HistoryEntry = z.infer<typeof EntrySchema>;

const KEY = "labs:history";
const MAX_ENTRIES = 50;
const EMPTY: HistoryEntry[] = [];

let cache: HistoryEntry[] | null = null;
const listeners = new Set<() => void>();

function read(): HistoryEntry[] {
  if (cache) return cache;
  try {
    const stored = z
      .array(EntrySchema)
      .safeParse(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    cache = stored.data ?? EMPTY;
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
function remember(entry: Omit<HistoryEntry, "at">) {
  const next = [{ ...entry, at: Date.now() }];
  for (const known of read()) {
    if (known.href !== entry.href && next.length < MAX_ENTRIES) {
      next.push(known);
    }
  }
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private windows may refuse storage; the list then lasts the visit
  }
  for (const listener of listeners) listener();
}

/** Records this page in the history once its title is known */
export function useRemember(entry: Omit<HistoryEntry, "at">) {
  const { kind, href, title, detail } = entry;
  useEffect(() => {
    remember({ kind, href, title, detail });
  }, [kind, href, title, detail]);
}

export function useHistory(kind: HistoryEntry["kind"]): HistoryEntry[] {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  return all.filter((entry) => entry.kind === kind);
}
