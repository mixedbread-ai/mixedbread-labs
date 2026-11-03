"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useRef,
  useState,
} from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/chat/conversation";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HoverCardTrigger } from "@/components/ui/hover-card";
import {
  CITATION_HREF,
  type DocCall,
  type DocChatMessage,
  type DocCitedPage,
  type DocSource,
} from "@/lib/chat";
import { SourceCards, sourceCard } from "./cited-page";
import { BADGE, COLUMN, Failure, FOCUS, Reveal, ToastMark } from "./controls";
import { COMPONENTS, Markdown } from "./markdown";
import { PageCard } from "./page-card";

/** An answer's citations, and the way a citation opens its page among the sources */
const SourcesContext = createContext<{
  sources: DocSource[];
  show: (n: number) => void;
}>({ sources: [], show: () => {} });
const ANSWER_COMPONENTS = { ...COMPONENTS, a: MarkdownLink };

/** The conversation scrolls above the composer, following the answer as it streams */
export function ChatPanel({ chat }: { chat: UseChatHelpers<DocChatMessage> }) {
  const { messages, status, error, regenerate } = chat;
  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);

  if (messages.length === 0) return null;

  return (
    <Conversation
      messages={messages}
      isStreaming={status === "streaming"}
      className="relative min-h-0 flex-1"
    >
      <ConversationContent
        scrollClassName="fade-y overscroll-contain"
        className={cn(COLUMN, "flex flex-col gap-8 pt-6 pb-8")}
      >
        {messages.map((message) =>
          message.role === "user" ? (
            <p
              key={message.id}
              className="ml-auto max-w-[85%] rounded-[20px] bg-secondary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap motion-safe:animate-rise"
            >
              {textOf(message)}
            </p>
          ) : (
            <Answer
              key={message.id}
              message={message}
              live={busy && message === last}
            />
          )
        )}
        {busy && last?.role === "user" && <Waiting label="Thinking" />}
        {error && !busy && (
          <Failure
            message="The answer failed."
            onRetry={() => void regenerate()}
          />
        )}
      </ConversationContent>
      <ConversationScrollButton />
      <SourceCards />
    </Conversation>
  );
}

function textOf(message: DocChatMessage): string {
  let text = "";
  for (const part of message.parts) {
    if (part.type === "text") text += part.text;
  }
  return text;
}

/** What Terra is doing while nothing shows it */
function pending(message: DocChatMessage): string | undefined {
  const last = message.parts.findLast(
    (part) => part.type !== "data-source" && part.type !== "data-page"
  );
  if (last?.type === "text") return last.text ? undefined : "Thinking";
  if (last?.type === "data-call") {
    return last.data.status === "in_progress" ? undefined : "Reading sources";
  }
  return "Thinking";
}

// How long a page stays lit after its citation opened it
const HIGHLIGHT_MS = 1600;

/** Terra's text in stream order, the calls it ran between grouped into runs, then the pages it cites */
function Answer({ message, live }: { message: DocChatMessage; live: boolean }) {
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sources: DocSource[] = [];
  const pages: DocCitedPage[] = [];
  const blocks: ReactNode[] = [];
  let run: { id: string; call: DocCall }[] = [];

  function closeRun() {
    if (run.length === 0) return;
    blocks.push(<Run key={run[0]?.id} calls={run} />);
    run = [];
  }

  for (const [index, part] of message.parts.entries()) {
    if (part.type === "data-call") {
      run.push({ id: part.id ?? String(index), call: part.data });
    } else if (part.type === "data-source") {
      sources.push(part.data);
    } else if (part.type === "data-page") {
      pages.push(part.data);
    } else if (part.type === "data-notice") {
      closeRun();
      blocks.push(
        <p
          key={index}
          className="text-[13px] text-muted-foreground motion-safe:animate-swap-in"
        >
          {part.data}
        </p>
      );
    } else if (part.type === "text" && part.text) {
      closeRun();
      blocks.push(
        <Markdown
          key={index}
          components={ANSWER_COMPONENTS}
          mode={live ? "streaming" : "static"}
          className="text-[15px] leading-relaxed"
        >
          {part.text}
        </Markdown>
      );
    }
  }
  closeRun();
  const waiting = live && pending(message);
  const cardId = (n: number) => `${message.id}-page-${n}`;

  /** Opens a cited page among the sources, brings it into view and lights it a moment */
  function show(n: number) {
    setOpen((current) => new Set(current).add(n));
    setHighlighted(n);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      document.getElementById(cardId(n))?.scrollIntoView({
        block: "start",
        behavior: reduced ? "instant" : "smooth",
      })
    );
  }

  return (
    <SourcesContext value={{ sources, show }}>
      <div className="flex flex-col gap-4 motion-safe:animate-rise">
        {blocks}
        {waiting && <Waiting label={waiting} />}
        {!live && pages.length > 0 && (
          <section aria-label="Sources" className="flex flex-col gap-1 pt-2">
            <h2 className="text-[13px] font-medium text-muted-foreground">
              {plural(pages.length, "source")}
            </h2>
            <ol className="flex flex-col">
              {pages
                .toSorted((a, b) => a.n - b.n)
                .map((page, index) => (
                  <PageCard
                    key={page.n}
                    id={cardId(page.n)}
                    page={page}
                    delay={index * 40}
                    open={open.has(page.n)}
                    onOpenChange={(next) =>
                      setOpen((current) => {
                        const updated = new Set(current);
                        if (next) updated.add(page.n);
                        else updated.delete(page.n);
                        return updated;
                      })
                    }
                    highlighted={highlighted === page.n}
                    meta={<span className={BADGE}>{page.n}</span>}
                  />
                ))}
            </ol>
          </section>
        )}
      </div>
    </SourcesContext>
  );
}

/** Shown a beat late, so quick steps never flash it */
function Waiting({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 text-[13px] motion-safe:animate-swap-in"
      style={{ animationDelay: "150ms" }}
    >
      <span className="flex w-5 justify-center">
        <ToastMark live />
      </span>
      <span
        key={label}
        className="text-shimmer text-[13px] motion-safe:animate-shimmer"
      >
        {label}
      </span>
    </div>
  );
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function quoted(terms: string[]): string {
  let text = "";
  for (const term of terms) text += `${text && ", "}“${term}”`;
  return text;
}

function seconds(ms: number): string {
  return ms < 10_000
    ? `${(ms / 1000).toFixed(1)}s`
    : `${Math.round(ms / 1000)}s`;
}

/** A call as a reader would say it */
function describe(call: DocCall): { verb: string; detail?: string } {
  const verb = call.status === "in_progress" ? "Searching" : "Searched";
  return { verb, detail: quoted(call.terms) };
}

/** The searches between Terra's words, as one collapsible activity row */
function Run({ calls }: { calls: { id: string; call: DocCall }[] }) {
  let running = false;
  let failed = 0;
  let hits = 0;
  let start = Number.POSITIVE_INFINITY;
  let end = 0;
  const terms: string[] = [];
  for (const { call } of calls) {
    if (call.status === "in_progress") running = true;
    if (call.status === "failed") failed++;
    hits += call.hits ?? 0;
    start = Math.min(start, call.at);
    end = Math.max(end, call.at + (call.ms ?? 0));
    for (const term of call.terms) terms.push(term);
  }
  const latest = calls.at(-1)?.call;

  // Toast 1 runs every search, so the row names it
  let label: ReactNode = "Toast 1 searched";
  if (running) {
    label = (
      <span className="text-shimmer text-[13px] motion-safe:animate-shimmer">
        Toast 1 is searching
      </span>
    );
  } else if (failed === calls.length) {
    label = <span className="text-destructive">Toast 1's search failed</span>;
  }

  return (
    <Collapsible>
      <CollapsibleTrigger
        className={cn(
          "group -ml-1 flex max-w-full items-center gap-2 rounded-md py-0.5 pr-1.5 pl-1 text-left text-[13px] text-muted-foreground transition-[color] duration-150 hover:text-foreground",
          FOCUS
        )}
      >
        <span className="flex w-5 shrink-0 justify-center">
          <ToastMark live={running} />
        </span>
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0">{label}</span>
          {terms.length > 0 && (
            <span className="truncate text-muted-foreground/75">
              {quoted(terms)}
            </span>
          )}
          {!running && (
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70 tabular-nums motion-safe:animate-swap-in">
              {plural(hits, "result")} · {seconds(end - start)}
            </span>
          )}
        </span>
        <ChevronRightIcon className="size-3.5 shrink-0 opacity-50 transition-[rotate] duration-250 ease-[cubic-bezier(0.2,0,0,1)] group-data-panel-open:rotate-90 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      {running && latest && <LiveLine call={latest} />}
      <Reveal>
        <ol className="mt-2 ml-[9.5px] flex flex-col gap-1.5 border-l border-soft pb-1 pl-[17.5px]">
          {calls.map(({ id, call }) => (
            <Step key={id} call={call} />
          ))}
        </ol>
      </Reveal>
    </Collapsible>
  );
}

function LiveLine({ call }: { call: DocCall }) {
  const { verb, detail } = describe(call);
  const text = detail ? `${verb} ${detail}` : verb;
  return (
    <div className="mt-0.5 ml-7 h-5 overflow-hidden text-xs leading-5 text-muted-foreground/80">
      <p key={text} className="truncate motion-safe:animate-swap-in">
        {text}
      </p>
    </div>
  );
}

function StatusDot({ status }: { status: DocCall["status"] }) {
  return (
    <span
      key={status}
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        status === "in_progress" && "bg-logo motion-safe:animate-breathe",
        status === "completed" &&
          "bg-muted-foreground/45 motion-safe:animate-pop",
        status === "failed" && "bg-destructive motion-safe:animate-pop"
      )}
    />
  );
}

function Step({ call }: { call: DocCall }) {
  const { verb, detail } = describe(call);
  const where =
    call.hits === undefined ? undefined : plural(call.hits, "result");

  return (
    <li className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground motion-safe:animate-rise">
      <StatusDot status={call.status} />
      <span className="shrink-0">{verb}</span>
      {detail && <span className="truncate text-foreground/75">{detail}</span>}
      {where && (
        <span className="ml-auto shrink-0 pl-2 text-[11px] text-muted-foreground/80 tabular-nums">
          {where}
        </span>
      )}
    </li>
  );
}

/** Hovering a citation previews what it cites; clicking opens its page among the sources */
function SourcePreview({
  source,
  className,
  children,
}: {
  source: DocSource;
  className: string;
  children: ReactNode;
}) {
  const { show } = use(SourcesContext);

  return (
    <HoverCardTrigger
      handle={sourceCard}
      payload={source}
      delay={150}
      render={<button type="button" onClick={() => show(source.n)} />}
      className={cn(className, FOCUS)}
    >
      {children}
    </HoverCardTrigger>
  );
}

/** Citations render as badges inline with the text; other links as links */
function MarkdownLink({
  node,
  href,
  children,
  ...props
}: ComponentProps<"a"> & { node?: unknown }) {
  const { sources } = use(SourcesContext);

  if (!href?.startsWith(CITATION_HREF)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline underline-offset-4"
        {...props}
      >
        {children}
      </a>
    );
  }

  const key = href.slice(CITATION_HREF.length);
  const source = sources.find((candidate) => candidate.key === key);
  const badge = cn(BADGE, "relative -top-[0.1em] mx-[0.15em] align-middle");
  if (!source) return <span className={badge}>{children}</span>;
  return (
    <SourcePreview
      source={source}
      className={cn(
        badge,
        "cursor-pointer transition-[background-color,color] duration-150 hover:bg-logo/15 hover:text-logo data-popup-open:bg-logo/15 data-popup-open:text-logo"
      )}
    >
      {source.n}
    </SourcePreview>
  );
}
