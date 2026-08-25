"use client";

import { Select } from "./ui";

export function LibrarySortControls({
  label,
  value,
  options,
  selectClassName = "w-56",
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  selectClassName?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${selectClassName} shrink-0`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
