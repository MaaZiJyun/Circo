"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/components/page-elements";
import { Button, Card } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { SummaryCelebration } from "@/modules/messages/views/summary-celebration";
import { shouldCelebrateFinishToday } from "../model/daily-summary-message";
import { useDashboardViewModel } from "../view-models/use-dashboard-view-model";
import { ContributionCalendar } from "./contribution-calendar";
import { PeriodCountdown } from "./period-countdown";
import { DailyTaskList } from "@/modules/me/views/daily-task-list";
import { FocusTimerDialog } from "./focus-timer-dialog";
import { FinishTodayDialog } from "./finish-today-dialog";
import { PlanningDialog } from "./planning-dialog";
import { TimeUsageWidget } from "../widgets/time-usage-widget";
import {
  PowerIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export function DashboardView() {
  const { t } = useI18n();
  const [focusOpen, setFocusOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const viewModel = useDashboardViewModel();
  if (!viewModel) return null;
  const { dailyTasks, finishedToday } = viewModel;
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
            <Button variant="secondary" onClick={() => setPlanningOpen(true)}>
              <CalendarDaysIcon className="size-4" />
              {t("dashboard.startPlanning")}
            </Button>
            <Button
              variant="secondary"
              disabled={finishedToday}
              onClick={() => setFinishOpen(true)}
            >
              <PowerIcon className="size-4" />
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
      <TimeUsageWidget />
      <ContributionCalendar dailyTasks={dailyTasks} />
      {focusOpen && <FocusTimerDialog onClose={() => setFocusOpen(false)} />}
      {planningOpen && (
        <PlanningDialog onClose={() => setPlanningOpen(false)} />
      )}
      {finishOpen && (
        <FinishTodayDialog
          onClose={() => setFinishOpen(false)}
          onFinished={(score) => {
            setFinishOpen(false);
            setCelebrating(shouldCelebrateFinishToday(score));
          }}
        />
      )}
      {celebrating && <SummaryCelebration />}
    </div>
  );
}
