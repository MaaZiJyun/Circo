"use client";

import { useState } from "react";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/20/solid";
import type { AppSection } from "@/shared/model/app-section";
import { PageHeader, SectionHeader } from "@/shared/components/page-elements";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
} from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useDashboardViewModel } from "../view-models/use-dashboard-view-model";
import { ContributionCalendar } from "./contribution-calendar";
import { PeriodCountdown } from "./period-countdown";
import { DailyTaskList } from "@/modules/me/views/daily-task-list";
import { FocusTimerDialog } from "./focus-timer-dialog";

export function DashboardView({
  navigate,
}: {
  navigate: (section: AppSection) => void;
}) {
  const { t, formatDate } = useI18n();
  const [focusOpen, setFocusOpen] = useState(false);
  const viewModel = useDashboardViewModel();
  if (!viewModel) return null;
  const { activeCycle, goals, dailyTasks } = viewModel;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <>
            <Button onClick={() => setFocusOpen(true)}>
              <ClockIcon className="size-4" />
              {t("dashboard.startFocus")}
            </Button>
            <Button variant="secondary" onClick={() => navigate("hand")}>
              <CalendarDaysIcon className="size-4" />
              {t("dashboard.startPlanning")}
            </Button>
            <Button variant="secondary" onClick={() => navigate("me")}>
              <ArrowPathIcon className="size-4" />
              {t("dashboard.startReview")}
            </Button>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <PeriodCountdown />
        </Card>
        <Card>
          <DailyTaskList />
        </Card>
      </div>
      <ContributionCalendar dailyTasks={dailyTasks} />
      <div>
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
      </div>
      {focusOpen && <FocusTimerDialog onClose={() => setFocusOpen(false)} />}
    </div>
  );
}
