"use client";

import type { ElementType } from "@mixedbread/sdk/resources/parsing/jobs";
import type { CSSProperties } from "react";
import { Field, Option, OptionFields } from "@/components/option-field";
import {
  ELEMENT_TYPES,
  FORMATS,
  MODES,
  type ParseOptions,
  typeColor,
} from "@/lib/parse";

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
    <OptionFields disabled={disabled}>
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
    </OptionFields>
  );
}
