"use client";

import { Menu } from "@base-ui/react/menu";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { CSSProperties } from "react";
import {
  FOCUS,
  POPUP,
  POPUP_ITEM,
  SEGMENT_PRESSED,
  SEGMENT_TRACK,
} from "@/components/controls";
import {
  DEFAULT_OPTIONS,
  ELEMENT_TYPES,
  FORMATS,
  MODES,
  type ParseOptions,
  typeColor,
} from "@/lib/parse";

const LABEL = "text-[13px] text-muted-foreground";

/** A segment that fits three to a phone's row */
const SEGMENT = cn(
  "flex h-full min-w-0 flex-1 items-center justify-center rounded-full px-2 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-[color] hover:text-foreground disabled:pointer-events-none",
  SEGMENT_PRESSED,
  FOCUS
);

/** One choice of several, held when pressed again rather than cleared */
function Segmented<Value extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: Value;
  items: { value: Value; label: string }[];
  onChange: (value: Value) => void;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={([next]) => next && onChange(next)}
      className={cn(SEGMENT_TRACK, "flex h-8 w-full")}
    >
      {items.map((item) => (
        <Toggle key={item.value} value={item.value} className={SEGMENT}>
          {item.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

/** Which element types to keep, picked from a menu so the row stays one line */
function ElementsMenu({
  types,
  onChange,
}: {
  types: ParseOptions["element_types"];
  onChange: (types: ParseOptions["element_types"]) => void;
}) {
  const all = types.length === ELEMENT_TYPES.length;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Elements"
        className={cn(
          SEGMENT_TRACK,
          "flex h-8 w-full items-center gap-2 px-3 text-left text-[13px] font-medium transition-[background-color] hover:bg-muted disabled:pointer-events-none data-popup-open:bg-muted",
          FOCUS
        )}
      >
        <span className="flex -space-x-0.5" aria-hidden="true">
          {types.slice(0, 6).map((type) => (
            <span
              key={type}
              className="size-2 rounded-[2px] bg-(--c) ring-1 ring-card"
              style={{ "--c": typeColor(type) } as CSSProperties}
            />
          ))}
        </span>
        <span className="min-w-0 flex-1 truncate">
          {all
            ? "All types"
            : `${types.length} of ${ELEMENT_TYPES.length} types`}
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className={cn(POPUP, "w-56")}>
            {ELEMENT_TYPES.map(({ type, label }) => (
              <Menu.CheckboxItem
                key={type}
                closeOnClick={false}
                checked={types.includes(type)}
                disabled={types.length === 1 && types.includes(type)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? DEFAULT_OPTIONS.element_types.filter(
                          (entry) => entry === type || types.includes(entry)
                        )
                      : types.filter((entry) => entry !== type)
                  )
                }
                style={{ "--c": typeColor(type) } as CSSProperties}
                className={cn(POPUP_ITEM, "data-disabled:opacity-60")}
              >
                <span className="flex size-3.5 items-center justify-center">
                  <Menu.CheckboxItemIndicator>
                    <CheckIcon className="size-3.5" />
                  </Menu.CheckboxItemIndicator>
                </span>
                <span className="size-2 rounded-[2px] bg-(--c)" />
                {label}
              </Menu.CheckboxItem>
            ))}
            {!all && (
              <>
                <Menu.Separator className="mx-2 my-1 h-px bg-soft" />
                <Menu.Item
                  onClick={() => onChange(DEFAULT_OPTIONS.element_types)}
                  className={POPUP_ITEM}
                >
                  <span className="size-3.5" />
                  Select all
                </Menu.Item>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** The parse job's options as labeled rows, set before a file goes up */
export function OptionsForm({
  options,
  onChange,
  disabled = false,
}: {
  options: ParseOptions;
  onChange: (options: ParseOptions) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 transition-opacity disabled:opacity-60 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
    >
      <span className={LABEL}>Mode</span>
      <Segmented
        label="Mode"
        value={options.mode}
        items={MODES}
        onChange={(mode) => onChange({ ...options, mode })}
      />
      <span className={LABEL}>Format</span>
      <Segmented
        label="Format"
        value={options.return_format}
        items={FORMATS}
        onChange={(format) => onChange({ ...options, return_format: format })}
      />
      <span className={LABEL}>Elements</span>
      <ElementsMenu
        types={options.element_types}
        onChange={(types) => onChange({ ...options, element_types: types })}
      />
    </fieldset>
  );
}
