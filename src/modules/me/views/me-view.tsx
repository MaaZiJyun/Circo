"use client";

import {
  PageHeader,
  SectionHeader,
  StatCard,
} from "@/shared/components/page-elements";
import { Card } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useDailyTaskCache } from "../view-models/use-daily-task-cache";
import { TaskQuadrant } from "./task-quadrant";

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
      <PageHeader
        eyebrow={t("me.eyebrow")}
        title={t("me.profileTitle")}
        subtitle={t("me.profileSubtitle")}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("dashboard.totalTime")}
          value={`${formatNumber(vm.metrics.totalMinutes / 60, { maximumFractionDigits: 1 })} ${t("common.hours")}`}
        />
        <StatCard
          label={t("dashboard.effectiveRate")}
          value={rate(vm.metrics.effectiveRate)}
          hint={t("dashboard.metricEffective")}
        />
        <StatCard
          label={t("dashboard.completionRate")}
          value={rate(vm.metrics.completionRate)}
          hint={t("dashboard.metricCompletion")}
        />
      </div>
      <Card>
        <SectionHeader title={t("me.taskQuadrant")} />
        <TaskQuadrant
          tasks={vm.dailyTasks}
          coordinates={vm.coordinates}
          formulas={vm.profile.matrixFormulas}
        />
      </Card>
    </div>
  );
}
