"use client";

import { Field, Option, OptionFields } from "@/components/option-field";
import type { ChatOptions } from "@/lib/chat";
import { MODES } from "@/lib/parse";

/** How the chat's store reads its files, as labeled selects */
export function ChatOptionsForm({
  options,
  onChange,
  disabled = false,
}: {
  options: ChatOptions;
  onChange: (options: ChatOptions) => void;
  disabled?: boolean;
}) {
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
    </OptionFields>
  );
}
