"use client";

import { Select } from "@base-ui/react/select";
import { cn } from "cn";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { FOCUS, POPUP, POPUP_ITEM, SEGMENT_TRACK } from "./controls";

const LABEL = "text-[13px] text-muted-foreground";

const TRIGGER = cn(
  SEGMENT_TRACK,
  "flex h-8 w-full cursor-pointer items-center gap-2 px-3 text-left text-[13px] transition-[background-color] hover:bg-muted disabled:pointer-events-none data-popup-open:bg-muted",
  FOCUS
);

const INDICATOR = "ml-auto flex size-3.5 items-center justify-center";

/** Options as rows of a label and a select, the selects lined up */
export function OptionFields({
  disabled = false,
  children,
}: {
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 transition-opacity disabled:opacity-60"
    >
      {children}
    </fieldset>
  );
}

/** A select whose trigger and popup every option row shares */
export function Field<Value extends string, Multiple extends boolean = false>({
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

export function Option({
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
