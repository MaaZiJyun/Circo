"use client";

import { Button } from "./ui";
import { useI18n } from "../i18n/i18n-context";

export function SelectionToolbar({ label, onCancel, children }: {
  label: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-4 flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      <span className="text-sm text-zinc-500">{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {children}
        <Button variant="ghost" onClick={onCancel}>{t("common.close")}</Button>
      </div>
    </div>
  );
}
