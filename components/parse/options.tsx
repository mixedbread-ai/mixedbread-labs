"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "cn";
import {
  FOCUS,
  SEGMENT,
  SEGMENT_PRESSED,
  SEGMENT_TRACK,
} from "@/components/controls";
import {
  ELEMENT_TYPES,
  FORMATS,
  MODES,
  type ParseOptions,
  typeColor,
} from "@/lib/parse";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[6rem_1fr] sm:items-start">
      <span className="pt-1.5 text-[13px] text-muted-foreground">{label}</span>
      {children}
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
      className={cn(SEGMENT_TRACK, "flex w-full")}
    >
      {items.map((item) => (
        <Toggle
          key={item.value}
          value={item.value}
          className={cn(SEGMENT, SEGMENT_PRESSED)}
        >
          {item.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

export function OptionsForm({
  options,
  onChange,
}: {
  options: ParseOptions;
  onChange: (options: ParseOptions) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Mode">
        <Segmented
          value={options.mode}
          items={MODES}
          onChange={(value) => onChange({ ...options, mode: value })}
        />
      </Field>
      <Field label="Format">
        <Segmented
          value={options.return_format}
          items={FORMATS}
          onChange={(value) => onChange({ ...options, return_format: value })}
        />
      </Field>
      <Field label="Elements">
        <ToggleGroup
          multiple
          value={options.element_types}
          onValueChange={(value) =>
            value.length > 0 && onChange({ ...options, element_types: value })
          }
          className="flex flex-wrap gap-1.5"
        >
          {ELEMENT_TYPES.map(({ type, label }) => (
            <Toggle
              key={type}
              value={type}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] text-muted-foreground/70 ring-1 ring-soft transition-[color,background-color,box-shadow] duration-150 hover:text-foreground data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-raised dark:data-pressed:bg-muted",
                FOCUS
              )}
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full opacity-35 transition-[opacity] in-data-pressed:opacity-100"
                style={{ background: typeColor(type) }}
              />
              {label}
            </Toggle>
          ))}
        </ToggleGroup>
      </Field>
    </div>
  );
}
