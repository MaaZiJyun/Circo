"use client";

import { forwardRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950";

const textInputTypes = new Set([
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "url",
]);

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200",
    secondary:
      "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
    ghost:
      "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
    danger:
      "border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950",
  };
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex size-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 ${focusRing} ${className}`}
      {...props}
    />
  );
}

export function Switch({
  checked,
  disabled = false,
  onChange,
  className = "",
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-200 ${focusRing} ${checked ? "border-green-500 bg-green-500" : "border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950"} ${className}`}
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={`size-6 rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-5 bg-white" : "translate-x-0 bg-white dark:bg-zinc-400"}`}
      />
    </button>
  );
}

export function Checkbox({
  checked,
  disabled = false,
  onChange,
  className = "",
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`inline-grid size-4 shrink-0 place-items-center rounded-full border border-zinc-700 bg-white transition-colors dark:border-white dark:bg-zinc-950 ${focusRing} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => onChange(!checked)}
    >
      {checked && (
        <span className="size-2 rounded-full bg-zinc-950 dark:bg-white" />
      )}
    </button>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", type = "text", ...props }, ref) {
  const cursorClass = textInputTypes.has(type) ? "textfield-cursor" : "";
  return (
    <input
      ref={ref}
      type={type}
      className={`min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 ${focusRing} ${cursorClass} ${className}`}
      {...props}
    />
  );
});

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`textfield-cursor min-h-28 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-6 text-zinc-950 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 ${focusRing} ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block w-full">
      <select
        className={`peer min-h-11 w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-10 text-sm text-zinc-950 transition-colors hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-700 ${focusRing} ${className}`}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400 peer-disabled:opacity-40"
        aria-hidden="true"
      />
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
      <span>{label}</span>
      {children}
      {hint && (
        <span className="text-xs font-normal text-zinc-500">{hint}</span>
      )}
    </label>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      {children}
    </section>
  );
}
