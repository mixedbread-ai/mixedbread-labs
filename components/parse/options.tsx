"use client";

import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { PICKER, POPUP, POPUP_ITEM, POPUP_LABEL } from "@/components/controls";
import {
  DEFAULT_OPTIONS,
  ELEMENT_TYPES,
  FORMATS,
  MODES,
  type ParseOptions,
  typeColor,
} from "@/lib/parse";

const INDICATOR =
  "absolute right-2 flex transition-[opacity,scale] duration-150 ease-spring data-ending-style:scale-50 data-ending-style:opacity-0 data-starting-style:scale-50 data-starting-style:opacity-0";

function Picker({
  label,
  value,
  children,
}: {
  label: string;
  value: ReactNode;
  children: ReactNode;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={label} className={cn(PICKER, "shrink-0")}>
        <span className="truncate">{value}</span>
        <ChevronDownIcon className="opacity-60" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={8} className="z-50">
          <Menu.Popup className={cn(POPUP, "w-56")}>
            <Menu.Group>
              <Menu.GroupLabel className={POPUP_LABEL}>{label}</Menu.GroupLabel>
              {children}
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function Choice<Value extends string>({
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
    <Picker
      label={label}
      value={items.find((item) => item.value === value)?.label}
    >
      <Menu.RadioGroup
        value={value}
        onValueChange={(next: Value) => onChange(next)}
      >
        {items.map((item) => (
          <Menu.RadioItem
            key={item.value}
            value={item.value}
            closeOnClick
            className={cn(POPUP_ITEM, "pr-8")}
          >
            {item.label}
            <Menu.RadioItemIndicator className={INDICATOR}>
              <CheckIcon className="size-3.5" />
            </Menu.RadioItemIndicator>
          </Menu.RadioItem>
        ))}
      </Menu.RadioGroup>
    </Picker>
  );
}

/** The parse job's options, as pickers in the card's bar */
export function OptionsBar({
  options,
  onChange,
}: {
  options: ParseOptions;
  onChange: (options: ParseOptions) => void;
}) {
  const types = options.element_types;
  const all = types.length === ELEMENT_TYPES.length;

  return (
    <>
      <Choice
        label="Mode"
        value={options.mode}
        items={MODES}
        onChange={(mode) => onChange({ ...options, mode })}
      />
      <Choice
        label="Format"
        value={options.return_format}
        items={FORMATS}
        onChange={(format) => onChange({ ...options, return_format: format })}
      />
      <Picker
        label="Elements"
        value={all ? "All elements" : `${types.length} elements`}
      >
        {ELEMENT_TYPES.map(({ type, label }) => (
          <Menu.CheckboxItem
            key={type}
            closeOnClick={false}
            checked={types.includes(type)}
            disabled={types.length === 1 && types.includes(type)}
            onCheckedChange={(checked) =>
              onChange({
                ...options,
                element_types: checked
                  ? DEFAULT_OPTIONS.element_types.filter(
                      (entry) => entry === type || types.includes(entry)
                    )
                  : types.filter((entry) => entry !== type),
              })
            }
            style={{ "--c": typeColor(type) } as CSSProperties}
            className={cn(POPUP_ITEM, "pr-8 data-disabled:opacity-60")}
          >
            <span className="size-2 rounded-[2px] bg-(--c)" />
            {label}
            <Menu.CheckboxItemIndicator className={INDICATOR}>
              <CheckIcon className="size-3.5" />
            </Menu.CheckboxItemIndicator>
          </Menu.CheckboxItem>
        ))}
      </Picker>
    </>
  );
}
