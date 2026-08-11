"use client";

import { useState } from "react";
import { ClockIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
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
  Field,
  Input,
  Textarea,
} from "@/shared/components/ui";
import { categoryLabels, typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useMeViewModel } from "../view-models/use-me-view-model";
import { CycleDialog } from "./cycle-dialog";
import { GoalProgress } from "./goal-progress";
import { EventDialog, SessionDialog } from "./me-forms";
import { GoalDialog } from "./goal-dialog";

export function MeView() {
  const { t, formatDate, formatNumber } = useI18n();
  const vm = useMeViewModel();
  const [dialog, setDialog] = useState<
    "cycle" | "goal" | "session" | "event" | null
  >(null);
  const [timerTitle, setTimerTitle] = useState("");
  const [timerOutput, setTimerOutput] = useState("");
  if (!vm) return null;
  const formatTimer = `${String(Math.floor(vm.timerSeconds / 60)).padStart(2, "0")}:${String(vm.timerSeconds % 60).padStart(2, "0")}`;
  const rate = (value: number | null) =>
    value === null
      ? t("common.noData")
      : formatNumber(value, { style: "percent", maximumFractionDigits: 0 });
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("me.eyebrow")}
        title={t("me.title")}
        subtitle={t("me.subtitle")}
        actions={
          <>
            <Button onClick={() => setDialog("cycle")} variant="ghost">
              <PlusIcon className="size-4" />
              {t("me.newCycle")}
            </Button>
            <Button onClick={() => setDialog("session")} variant="secondary">
              <ClockIcon className="size-4" />
              {t("me.logTime")}
            </Button>
            <Button onClick={() => setDialog("goal")}>
              <PlusIcon className="size-4" />
              {t("me.newGoal")}
            </Button>
          </>
        }
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
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <SectionHeader title={t("me.timer")} />
          <p className="text-sm text-zinc-500">
            {vm.timerRunning ? t("me.timerRunning") : t("me.timerReady")}
          </p>
          <p className="my-6 font-mono text-5xl font-semibold tabular-nums">
            {formatTimer}
          </p>
          <div className="grid gap-3">
            <Field label={t("me.sessionTitle")}>
              <Input
                value={timerTitle}
                onChange={(event) => setTimerTitle(event.target.value)}
              />
            </Field>
            {vm.timerSeconds > 0 && (
              <Field label={t("me.output")}>
                <Input
                  value={timerOutput}
                  onChange={(event) => setTimerOutput(event.target.value)}
                />
              </Field>
            )}
            <div className="flex gap-2">
              {vm.timerSeconds === 0 ? (
                <Button
                  disabled={!timerTitle.trim()}
                  onClick={() => vm.setTimerRunning(true)}
                >
                  {t("me.start")}
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => vm.setTimerRunning(!vm.timerRunning)}
                  >
                    {vm.timerRunning ? t("me.pause") : t("me.start")}
                  </Button>
                  <Button
                    disabled={!timerTitle.trim()}
                    onClick={() => {
                      vm.finishTimer(timerTitle, timerOutput);
                      setTimerTitle("");
                      setTimerOutput("");
                    }}
                  >
                    {t("me.finish")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
        <Card>
          <SectionHeader title={t("me.goals")} />
          {vm.goals.length ? (
            <div className="grid gap-5">
              {vm.goals.map((goal) => (
                <GoalProgress
                  key={goal.id}
                  goal={goal}
                  update={(value) => vm.updateGoal(goal.id, value)}
                  remove={() =>
                    window.confirm(t("common.confirmDelete")) &&
                    vm.deleteGoal(goal.id)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader title={t("me.sessions")} />
          {vm.sessions.length ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {vm.sessions.slice(0, 6).map((session) => (
                <div key={session.id} className="flex items-center gap-3 py-3">
                  <span
                    className={`size-2 rounded-full ${session.effective ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {session.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(session.startedAt)} · {session.minutes}{" "}
                      {t("common.minutes")}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {session.output}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </Card>
        <Card>
          <SectionHeader
            title={t("me.events")}
            action={
              <Button variant="ghost" onClick={() => setDialog("event")}>
                <PlusIcon className="size-4" />
                {t("me.recordEvent")}
              </Button>
            }
          />
          {vm.events.length ? (
            <div className="grid gap-3">
              {vm.events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex gap-2">
                    <Badge
                      tone={
                        event.type === "success"
                          ? "success"
                          : event.type === "error"
                            ? "danger"
                            : "info"
                      }
                    >
                      {t(typeLabels[event.type])}
                    </Badge>
                    <Badge>{t(categoryLabels[event.category])}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">{event.phenomenon}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {event.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </Card>
      </div>
      <Card>
        <SectionHeader
          title={t("me.review")}
          action={
            <Button variant="secondary" onClick={vm.generateReview}>
              <SparklesIcon className="size-4" />
              {t("me.generateReview")}
            </Button>
          }
        />
        <Textarea
          value={vm.cycle?.review ?? ""}
          readOnly
          className="min-h-48 font-mono"
        />
        {vm.cycle?.status === "active" && (
          <Button
            className="mt-3"
            variant="secondary"
            onClick={vm.archiveCycle}
          >
            {t("me.archiveCycle")}
          </Button>
        )}
      </Card>
      <CycleDialog
        open={dialog === "cycle"}
        onClose={() => setDialog(null)}
        onSave={vm.addCycle}
      />
      <GoalDialog
        open={dialog === "goal"}
        onClose={() => setDialog(null)}
        onSave={vm.addGoal}
        today={vm.today}
      />
      <SessionDialog
        open={dialog === "session"}
        onClose={() => setDialog(null)}
        onSave={vm.addSession}
        goals={vm.goals}
        projects={vm.projects}
        tasks={vm.tasks}
      />
      <EventDialog
        open={dialog === "event"}
        onClose={() => setDialog(null)}
        onSave={vm.addEvent}
      />
    </div>
  );
}
