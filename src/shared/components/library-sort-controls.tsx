"use client";

import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
} from "@heroicons/react/24/outline";
import { IconButton, Select } from "./ui";

export function LibrarySortControls({
  label,
  value,
  options,
  ascending,
  directionLabel,
  selectClassName = "w-36",
  onChange,
  onToggleDirection,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  ascending: boolean;
  directionLabel: string;
  selectClassName?: string;
  onChange: (value: string) => void;
  onToggleDirection: () => void;
}) {
  return (
    <>
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
      <IconButton label={directionLabel} onClick={onToggleDirection}>
        {ascending ? (
          <BarsArrowUpIcon className="size-5" />
        ) : (
          <BarsArrowDownIcon className="size-5" />
        )}
      </IconButton>
    </>
  );
}
