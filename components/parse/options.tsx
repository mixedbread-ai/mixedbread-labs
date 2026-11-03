"use client";

import { Select } from "@base-ui/react/select";
import type { ElementType } from "@mixedbread/sdk/resources/parsing/jobs";
import { cn } from "cn";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { FOCUS, POPUP, POPUP_ITEM, SEGMENT_TRACK } from "@/components/controls";
import {
  ELEMENT_TYPES,
  FORMATS,
  MODES,
  type ParseOptions,
  typeColor,
} from "@/lib/parse";

const LABEL = "text-[13px] text-muted-foreground";

const TRIGGER = cn(
  SEGMENT_TRACK,
  "flex h-8 w-full cursor-pointer items-center gap-2 px-3 text-left text-[13px] transition-[background-color] hover:bg-muted disabled:pointer-events-none data-popup-open:bg-muted",
  FOCUS
);

const INDICATOR = "ml-auto flex size-3.5 items-center justify-center";

/** A select whose trigger and popup every option row shares */
function Field<Value extends string, Multiple extends boolean = false>({
  label,
  value,
  multiple,
  onValueChange,
  display,
  children,
}: {
  label: string;
  value: Multiple extends true ? Value[] : Value;
  multiple?: Multiple;
  onValueChange: (value: Multiple extends true ? Value[] : Value) => void;
  /** What the trigger shows for the value */
  display: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <span className={LABEL}>{label}</span>
      <Select.Root<Value, Multiple>
        value={value}
        multiple={multiple}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <Select.Trigger aria-label={label} className={TRIGGER}>
          <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
            {display}
          </span>
          <Select.Icon className="shrink-0 text-muted-foreground">
            <ChevronsUpDownIcon className="size-3.5" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            alignItemWithTrigger={false}
            align="start"
            sideOffset={6}
            className="z-50"
          >
            <Select.Popup
              className={cn(
                POPUP,
                "max-h-(--available-height) w-(--anchor-width) min-w-48 overflow-y-auto"
              )}
            >
              {children}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </>
  );
}

function Option({
  value,
  disabled,
  style,
  children,
}: {
  value: string;
  disabled?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Select.Item
      value={value}
      disabled={disabled}
      style={style}
      className={cn(POPUP_ITEM, "data-disabled:opacity-60")}
    >
      <Select.ItemText className="flex items-center gap-2">
        {children}
      </Select.ItemText>
      <Select.ItemIndicator className={INDICATOR}>
        <CheckIcon className="size-3.5" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

/** How many types are kept, then their colors, so the text starts where the other rows' does */
function TypesValue({ types }: { types: ElementType[] }) {
  return (
    <>
      <span className="min-w-0 flex-1 truncate">
        {types.length === ELEMENT_TYPES.length
          ? "All types"
          : `${types.length} of ${ELEMENT_TYPES.length} types`}
      </span>
      <span aria-hidden="true" className="flex shrink-0 -space-x-0.5">
        {types.slice(0, 6).map((type) => (
          <span
            key={type}
            className="size-2 rounded-[2px] bg-(--c) ring-1 ring-card"
            style={{ "--c": typeColor(type) } as CSSProperties}
          />
        ))}
      </span>
    </>
  );
}

/** The parse job's options as labeled selects */
export function OptionsForm({
  options,
  onChange,
  disabled = false,
}: {
  options: ParseOptions;
  onChange: (options: ParseOptions) => void;
  disabled?: boolean;
}) {
  const types = options.element_types;

  return (
    <fieldset
      disabled={disabled}
      className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 transition-opacity disabled:opacity-60"
    >
      <Field
        label="Mode"
        value={options.mode}
        onValueChange={(mode) => onChange({ ...options, mode })}
        display={MODES.find(({ value }) => value === options.mode)?.label}
      >
        {MODES.map(({ value, label }) => (
          <Option key={value} value={value}>
            {label}
          </Option>
        ))}
      </Field>
      <Field
        label="Format"
        value={options.return_format}
        onValueChange={(format) =>
          onChange({ ...options, return_format: format })
        }
        display={
          FORMATS.find(({ value }) => value === options.return_format)?.label
        }
      >
        {FORMATS.map(({ value, label }) => (
          <Option key={value} value={value}>
            {label}
          </Option>
        ))}
      </Field>
      <Field
        label="Elements"
        multiple
        value={types}
        onValueChange={(next) =>
          next.length > 0 &&
          onChange({
            ...options,
            // Kept in the list's order, whichever order they were picked in
            element_types: ELEMENT_TYPES.flatMap(({ type }) =>
              next.includes(type) ? [type] : []
            ),
          })
        }
        display={<TypesValue types={types} />}
      >
        {ELEMENT_TYPES.map(({ type, label }) => (
          <Option
            key={type}
            value={type}
            disabled={types.length === 1 && types.includes(type)}
            style={{ "--c": typeColor(type) } as CSSProperties}
          >
            <span className="size-2 rounded-[2px] bg-(--c)" />
            {label}
          </Option>
        ))}
      </Field>
    </fieldset>
  );
}
