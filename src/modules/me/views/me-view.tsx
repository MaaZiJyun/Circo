"use client";

import { PageHeader, StatCard } from "@/shared/components/page-elements";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useDailyTaskCache } from "../view-models/use-daily-task-cache";
import { DailyTaskHistory } from "./daily-task-history";

export function MeView() {
  const { t, formatNumber } = useI18n();
  const vm = useDailyTaskCache();
  if (!vm) return null;
  const rate = (value: number | null) =>
    value === null
      ? t("common.noData")
      : formatNumber(value, { style: "percent", maximumFractionDigits: 0 });
  return (
    <div className="space-y-8">
      <DailyTaskHistory />
    </div>
  );
}
