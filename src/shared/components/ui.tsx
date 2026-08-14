"use client";

import { Fragment } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { focusRing, IconButton } from "./controls";

export {
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
} from "./controls";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  const styles = {
    neutral:
      "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
    success:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
    warning:
      "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300",
    danger:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function Alert({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const Icon =
    tone === "success"
      ? CheckCircleIcon
      : tone === "warning"
        ? ExclamationTriangleIcon
        : tone === "danger"
          ? XCircleIcon
          : InformationCircleIcon;
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
    success:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
    warning:
      "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
    danger:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  };
  return (
    <div
      role="status"
      className={`flex gap-2 rounded-xl border p-3 text-sm ${styles[tone]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Dialog({
  open,
  title,
  closeLabel,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid cursor-pointer place-items-center bg-black/55 p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-xl cursor-default overflow-y-auto rounded-2xl bg-white p-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <XMarkIcon className="size-5" />
          </IconButton>
        </header>
        {children}
      </section>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-dvh items-center justify-center gap-3 overflow-y-auto text-sm text-zinc-500">
      <span className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950 dark:border-zinc-700 dark:border-t-zinc-50" />
      {label}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-950 transition-[width] dark:bg-zinc-50"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string }[];
}) {
  return (
    <div
      className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900"
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          className={`min-h-9 flex-1 rounded-full px-3 text-sm font-medium ${focusRing} ${value === item.value ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-500"}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function DescriptionList({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="grid gap-3">
      {items.map((item) => (
        <Fragment key={item.label}>
          <div className="flex items-start justify-between gap-4 text-sm">
            <dt className="text-zinc-500">{item.label}</dt>
            <dd className="text-right font-medium">{item.value}</dd>
          </div>
        </Fragment>
      ))}
    </dl>
  );
}
