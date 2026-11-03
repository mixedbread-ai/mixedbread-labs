"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import {
  FOCUS,
  Reveal,
  SEGMENT,
  SEGMENT_PRESSED,
  SEGMENT_TRACK,
} from "@/components/controls";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DEFAULT_OPTIONS,
  ELEMENT_TYPES,
  FORMATS,
  MODES,
  type ParseOptions,
  typeColor,
} from "@/lib/parse";

const MODE_NOTES: Record<ParseOptions["mode"], string> = {
  high_quality: "Reads each element with the full parsing model.",
  fast: "Reads each element with a lighter model, for quicker results.",
};

const FORMAT_NOTES: Record<ParseOptions["return_format"], string> = {
  markdown: "Headings, lists, tables and math as Markdown.",
  html: "Tables and structure as HTML.",
  plain: "Text only, without formatting.",
};

function Field({
  label,
  note,
  aside,
  children,
}: {
  label: string;
  note?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 items-center justify-between">
        <span className="text-[13px] font-medium">{label}</span>
        {aside}
      </div>
      {children}
      {note && (
        <p
          key={note}
          className="text-xs text-muted-foreground motion-safe:animate-swap-in"
        >
          {note}
        </p>
      )}
    </div>
  );
}

/** One choice of several, held when pressed again rather than cleared */
function Segmented<Value extends string>({
  value,
  items,
  onChange,
}: {
  value: Value;
  items: { value: Value; label: string }[];
  onChange: (value: Value) => void;
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={([next]) => next && onChange(next)}
      className={cn(SEGMENT_TRACK, "flex h-8 w-full")}
    >
      {items.map((item) => (
        <Toggle
          key={item.value}
          value={item.value}
          className={cn(SEGMENT, SEGMENT_PRESSED, "h-full py-0")}
        >
          {item.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

/** The parse job's options, each named and explained */
export function OptionsForm({
  options,
  onChange,
}: {
  options: ParseOptions;
  onChange: (options: ParseOptions) => void;
}) {
  const types = options.element_types;
  const all = types.length === ELEMENT_TYPES.length;

  return (
    <div className="flex flex-col gap-5">
      <Field label="Mode" note={MODE_NOTES[options.mode]}>
        <Segmented
          value={options.mode}
          items={MODES}
          onChange={(mode) => onChange({ ...options, mode })}
        />
      </Field>
      <Field label="Format" note={FORMAT_NOTES[options.return_format]}>
        <Segmented
          value={options.return_format}
          items={FORMATS}
          onChange={(format) => onChange({ ...options, return_format: format })}
        />
      </Field>
      <Field
        label="Elements"
        aside={
          <button
            type="button"
            disabled={all}
            onClick={() =>
              onChange({
                ...options,
                element_types: DEFAULT_OPTIONS.element_types,
              })
            }
            className={cn(
              "rounded-sm text-xs text-muted-foreground transition-[color,opacity] hover:text-foreground disabled:opacity-0",
              FOCUS
            )}
          >
            Select all
          </button>
        }
      >
        <ToggleGroup
          multiple
          value={types}
          onValueChange={(value) =>
            value.length > 0 && onChange({ ...options, element_types: value })
          }
          className="flex flex-wrap gap-1.5"
        >
          {ELEMENT_TYPES.map(({ type, label }) => (
            <Toggle
              key={type}
              value={type}
              style={{ "--c": typeColor(type) } as CSSProperties}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground/80 ring-1 ring-soft transition-[background-color,color,box-shadow] duration-150 hover:text-foreground data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-raised dark:data-pressed:bg-muted",
                FOCUS
              )}
            >
              <span className="size-2 rounded-[2px] bg-(--c) opacity-30 transition-opacity in-data-pressed:opacity-100" />
              {label}
            </Toggle>
          ))}
        </ToggleGroup>
      </Field>
    </div>
  );
}

export function summaryOf(options: ParseOptions): string {
  const mode = MODES.find(({ value }) => value === options.mode)?.label;
  const format = FORMATS.find(
    ({ value }) => value === options.return_format
  )?.label;
  const count = options.element_types.length;
  const elements =
    count === ELEMENT_TYPES.length ? "All elements" : `${count} element types`;
  return `${mode} · ${format} · ${elements}`;
}

/** What a parse will use, in a line that opens to change it */
export function OptionsPanel({
  options,
  onChange,
  disabled,
}: {
  options: ParseOptions;
  onChange: (options: ParseOptions) => void;
  disabled: boolean;
}) {
  return (
    <Collapsible disabled={disabled} className="flex flex-col items-center">
      <CollapsibleTrigger
        className={cn(
          "group flex h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground transition-[color,background-color] duration-150 hover:bg-soft hover:text-foreground disabled:pointer-events-none disabled:opacity-50 data-panel-open:text-foreground",
          FOCUS
        )}
      >
        <span className="shrink-0">Options</span>
        <span aria-hidden="true" className="text-muted-foreground/60">
          ·
        </span>
        <span className="truncate text-muted-foreground">
          {summaryOf(options)}
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-60 transition-[rotate] duration-250 ease-smooth group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <div className="w-full">
        <Reveal>
          {/* A border, not a ring: the fold clips anything drawn outside the box */}
          <div className="mt-2 rounded-2xl border border-soft bg-card p-4">
            <OptionsForm options={options} onChange={onChange} />
          </div>
        </Reveal>
      </div>
    </Collapsible>
  );
}
