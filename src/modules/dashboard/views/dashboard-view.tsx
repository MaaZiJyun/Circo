"use client";

import { ArrowRightIcon, BoltIcon, ClockIcon } from "@heroicons/react/20/solid";
import type { AppSection } from "@/shared/components/app-shell";
import {
  PageHeader,
  SectionHeader,
  StatCard,
} from "@/shared/components/page-elements";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
} from "@/shared/components/ui";
import { statusLabels, typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useDashboardViewModel } from "../view-models/use-dashboard-view-model";
import { ContributionCalendar } from "./contribution-calendar";

const loop: {
  id: AppSection;
  label: "nav.me" | "nav.find" | "nav.mind" | "nav.hand" | "nav.land";
}[] = [
  { id: "me", label: "nav.me" },
  { id: "find", label: "nav.find" },
  { id: "mind", label: "nav.mind" },
  { id: "hand", label: "nav.hand" },
  { id: "land", label: "nav.land" },
];

export function DashboardView({
  navigate,
}: {
  navigate: (section: AppSection) => void;
}) {
  const { t, formatDate, formatNumber } = useI18n();
  const viewModel = useDashboardViewModel();
  if (!viewModel) return null;
  const { metrics, activeCycle, goals, recentArtifacts, sessions } = viewModel;
  const rate = (value: number | null) =>
    value === null
      ? t("common.noData")
      : formatNumber(value, { style: "percent", maximumFractionDigits: 0 });
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <>
            <Button onClick={() => navigate("me")}>
              <ClockIcon className="size-4" />
              {t("dashboard.startFocus")}
            </Button>
            <Button variant="secondary" onClick={() => navigate("mind")}>
              <BoltIcon className="size-4" />
              {t("dashboard.addIdea")}
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.totalTime")}
          value={`${formatNumber(metrics.totalMinutes / 60, { maximumFractionDigits: 1 })} ${t("common.hours")}`}
        />
        <StatCard
          label={t("dashboard.effectiveRate")}
          value={rate(metrics.effectiveRate)}
          hint={t("dashboard.metricEffective")}
        />
        <StatCard
          label={t("dashboard.completionRate")}
          value={rate(metrics.completionRate)}
          hint={t("dashboard.metricCompletion")}
        />
        <StatCard
          label={t("dashboard.activeProjects")}
          value={formatNumber(metrics.activeProjects)}
        />
      </div>
      <ContributionCalendar sessions={sessions} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeader
            title={t("dashboard.goals")}
            action={
              activeCycle && (
                <span className="text-xs text-zinc-500">
                  {formatDate(activeCycle.startDate)} –{" "}
                  {formatDate(activeCycle.endDate)}
                </span>
              )
            }
          />
          {goals.length ? (
            <div className="grid gap-5">
              {goals.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{goal.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {goal.current} / {goal.target} {goal.unit}
                      </p>
                    </div>
                    <Badge
                      tone={goal.status === "completed" ? "success" : "info"}
                    >
                      {t(statusLabels[goal.status])}
                    </Badge>
                  </div>
                  <ProgressBar
                    value={goal.percent}
                    label={t("common.progress")}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </Card>
        <Card>
          <SectionHeader title={t("dashboard.flow")} />
          <p className="mb-5 text-sm text-zinc-500">
            {t("dashboard.flowHint")}
          </p>
          <div className="grid gap-2">
            {loop.map((item, index) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="group flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <span className="grid size-7 place-items-center rounded-full bg-zinc-950 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                  {index + 1}
                </span>
                <span className="font-medium">{t(item.label)}</span>
                <ArrowRightIcon className="ml-auto size-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <SectionHeader title={t("dashboard.recent")} />
        {recentArtifacts.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {recentArtifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => navigate("land")}
                className="rounded-xl border border-zinc-200 p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <Badge
                  tone={
                    artifact.status === "published" ||
                    artifact.status === "final"
                      ? "success"
                      : "warning"
                  }
                >
                  {t(statusLabels[artifact.status])}
                </Badge>
                <h3 className="mt-3 font-medium">{artifact.title}</h3>
                <p className="mt-2 text-xs text-zinc-500">
                  {t(typeLabels[artifact.type])} ·{" "}
                  {formatDate(artifact.updatedAt)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title={t("common.noData")} />
        )}
      </Card>
    </div>
  );
}
