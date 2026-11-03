"use client";

import { Tabs } from "@base-ui/react/tabs";
import { cn } from "cn";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import Image from "next/image";
import { type ReactNode, type RefObject, useId } from "react";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { IconSwap } from "@/components/ui/icon-swap";

/**
 * The reading column. Scroll areas span the window, so their scrollbars sit at
 * its edge, and center their content in this.
 */
export const COLUMN = "mx-auto w-full max-w-[calc(48rem+3rem)] px-4 sm:px-6";

export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

/** A quiet pill that lifts on hover, as the suggestions do */
export const PILL = cn(
  "flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] whitespace-nowrap text-muted-foreground ring-1 ring-soft transition-[color,background-color,box-shadow] duration-150 hover:bg-card hover:text-foreground hover:shadow-raised hover:ring-foreground/15 data-popup-open:bg-card data-popup-open:text-foreground data-popup-open:shadow-raised",
  FOCUS
);

/** The playground's dark round button, for the one action a view leads to */
export const PRIMARY = cn(
  "flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background shadow-raised transition-[opacity,scale] duration-200 ease-out-quint active:scale-95 disabled:cursor-default disabled:opacity-40",
  FOCUS
);

/** A raised card, the surface results and uploads sit on */
export const CARD = "rounded-2xl bg-card shadow-raised ring-1 ring-soft";

/** A segment of `SegmentList`, and of the option pickers that look like it */
export const SEGMENT = cn(
  "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-[color] hover:text-foreground data-active:text-foreground",
  FOCUS
);

export const SEGMENT_TRACK =
  "relative inline-flex items-center rounded-full bg-muted/60 p-0.5 ring-1 ring-soft dark:bg-background/60";

/** The pressed segment of a picker without a sliding indicator */
export const SEGMENT_PRESSED =
  "data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-raised data-pressed:ring-1 data-pressed:ring-soft dark:data-pressed:bg-muted";

/** The playground's mode switch: tabs on a track, the active one raised and sliding between them */
export function SegmentList({
  children,
  className,
  ...props
}: Tabs.List.Props) {
  return (
    <Tabs.List {...props} className={cn(SEGMENT_TRACK, className)}>
      <Tabs.Indicator
        renderBeforeHydration
        className="absolute top-(--active-tab-top) left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-card shadow-raised ring-1 ring-soft transition-[translate,width] duration-300 ease-out-quint motion-reduce:transition-none dark:bg-muted"
      />
      {children}
    </Tabs.List>
  );
}

/** Mono numbers on a soft chip: pages, citations */
export const BADGE =
  "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-[0.35rem] bg-soft px-1 font-mono text-[11px] text-muted-foreground tabular-nums";

/** How everything that folds open moves: the result previews and every `Reveal` */
export const FOLD =
  "transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";

/**
 * A Collapsible panel that unfolds by its grid row. It stays laid out while
 * shut, so opening neither renders nor measures anything first; `inert` keeps
 * the folded content out of reach.
 */
export function Reveal({ children }: { children: ReactNode }) {
  return (
    <CollapsibleContent
      keepMounted
      render={(props, state) => (
        <div {...props} hidden={false} inert={!state.open} />
      )}
      className={cn("grid grid-rows-[0fr] data-open:grid-rows-[1fr]", FOLD)}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </CollapsibleContent>
  );
}

/** A request that failed, and the way to send it again */
export function Failure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <p className="flex items-center gap-2 text-[13px] motion-safe:animate-swap-in">
      <span className="text-destructive">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "rounded-sm text-muted-foreground underline underline-offset-4 transition-[color] hover:text-foreground",
          FOCUS
        )}
      >
        Try again
      </button>
    </p>
  );
}

export function Suggestions({
  items,
  onPick,
}: {
  items: readonly string[];
  onPick: (item: string) => void;
}) {
  return (
    // One row that scrolls sideways on small screens, as in Mixedbread Chat,
    // rather than a ragged stack of wrapped pills
    <ul className="flex flex-wrap justify-center gap-2 max-md:-mx-4 max-md:scrollbar-none max-md:flex-nowrap max-md:justify-start max-md:overflow-x-auto max-md:fade-x max-md:px-4 max-md:py-1">
      {items.map((item, index) => (
        <li
          key={item}
          className="shrink-0 motion-safe:animate-rise"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <button
            type="button"
            onClick={() => onPick(item)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap text-muted-foreground ring-1 ring-soft transition-[color,background-color,box-shadow] duration-150 hover:bg-card hover:text-foreground hover:shadow-raised hover:ring-foreground/15",
              FOCUS
            )}
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Sends, and stops a running answer when given `onStop` */
function SendButton({
  state,
  onStop,
}: {
  state: "idle" | "ready" | "busy";
  onStop?: () => void;
}) {
  const stop = state === "busy" && onStop !== undefined;

  return (
    <button
      type={stop ? "button" : "submit"}
      disabled={state === "idle"}
      onClick={stop ? onStop : undefined}
      data-state={state}
      className={cn(
        "group/send relative flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-raised transition-[background-color,color,scale] duration-200 ease-out-quint active:scale-90 disabled:cursor-default data-[state=idle]:bg-soft data-[state=idle]:text-muted-foreground data-[state=idle]:shadow-none motion-reduce:transition-none",
        FOCUS
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -inset-[3px] rounded-full border-[1.5px] border-transparent border-t-logo opacity-0 transition-[opacity] duration-300 group-data-[state=busy]/send:opacity-100 group-data-[state=busy]/send:motion-safe:animate-spin"
      />
      <IconSwap
        state={stop ? "b" : "a"}
        a={<ArrowUpIcon className="size-4" strokeWidth={2.25} />}
        b={<SquareIcon className="size-3 fill-current" />}
      />
      <span className="sr-only">{stop ? "Stop" : "Send"}</span>
    </button>
  );
}

/** The one input of the playground, raised like Mixedbread Chat's; `children` start its bottom bar, `actions` sit by the send button */
export function Composer({
  inputRef,
  value,
  onValueChange,
  placeholder,
  busy,
  onSubmit,
  onStop,
  actions,
  children,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  busy: boolean;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const ready = value.trim() !== "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit(value);
      }}
      // A press on the card's empty space types, as if the whole card were the field
      onMouseDown={(e) => {
        const { target } = e;
        const empty =
          target === e.currentTarget ||
          (target instanceof HTMLElement && target.dataset.slot === "bar");
        if (!empty) return;
        e.preventDefault();
        inputRef.current?.focus();
      }}
      className="flex cursor-text flex-col rounded-[22px] bg-card shadow-composer ring-1 ring-soft transition-[box-shadow] duration-200 ease-out-quint focus-within:shadow-[var(--elevation-composer),0_0_0_4px_color-mix(in_oklch,var(--logo-orange)_12%,transparent)] focus-within:ring-foreground/20"
    >
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <textarea
        ref={inputRef}
        id={id}
        value={value}
        rows={1}
        maxLength={1000}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        className="field-sizing-content max-h-40 min-h-13 w-full resize-none bg-transparent px-4.5 pt-4 pb-1 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
      />
      <div data-slot="bar" className="flex items-center gap-2 px-2.5 pb-2.5">
        {children}
        <span className="ml-auto flex items-center gap-1.5">
          {actions}
          <SendButton
            state={busy ? "busy" : ready ? "ready" : "idle"}
            onStop={onStop}
          />
        </span>
      </div>
    </form>
  );
}

/** The Toast mascot, bobbing while Toast works */
export function ToastMark({ live = false }: { live?: boolean }) {
  return (
    <Image
      src="/toast.svg"
      alt=""
      aria-hidden="true"
      width={20}
      height={16}
      unoptimized
      className={cn("h-4 w-auto", live && "motion-safe:animate-toast-bob")}
    />
  );
}
