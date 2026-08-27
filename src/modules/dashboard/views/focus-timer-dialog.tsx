"use client";

import { useEffect, useRef, useState } from "react";
import {
  PauseIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Button, Dialog, Field, Input, Tabs } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { DailyTask } from "@/shared/model/entities";
import { formatLocalDateTime, now, today } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";
import { addFocus } from "@/shared/model/focus";
import { useDailyTaskCache } from "@/modules/me/view-models/use-daily-task-cache";

function timerText(milliseconds: number) {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor(milliseconds / 60_000) % 60;
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const millis = milliseconds % 1000;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
    .concat(`.${String(millis).padStart(3, "0")}`);
}

export function FocusTimerDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const dailyCache = useDailyTaskCache();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [offlineStart, setOfflineStart] = useState("");
  const [offlineEnd, setOfflineEnd] = useState("");
  const [offlineDuration, setOfflineDuration] = useState("");
  const [taskId, setTaskId] = useState("");
  const startedAt = useRef("");
  const accumulated = useRef(0);
  const segmentStart = useRef<number | null>(null);

  useEffect(() => {
    if (!running || stopped) return;
    if (segmentStart.current === null) segmentStart.current = performance.now();
    let frame = 0;
    const tick = () => {
      setElapsed(
        Math.floor(
          accumulated.current +
            performance.now() -
            (segmentStart.current ?? performance.now()),
        ),
      );
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [running, stopped]);

  if (!state || !dailyCache) return null;
  const currentDate = today();
  const activities = dailyCache.dailyTasks.filter((task) => task.date === currentDate && !task.deletedAt);
  const pause = () => {
    if (segmentStart.current !== null)
      accumulated.current += performance.now() - segmentStart.current;
    segmentStart.current = null;
    setElapsed(Math.floor(accumulated.current));
    setRunning(false);
  };
  const resume = () => {
    if (!started) {
      startedAt.current = now();
      setStarted(true);
    }
    segmentStart.current = performance.now();
    setRunning(true);
  };
  const stop = () => {
    if (running && segmentStart.current !== null)
      accumulated.current += performance.now() - segmentStart.current;
    segmentStart.current = null;
    setElapsed(Math.floor(accumulated.current));
    setRunning(false);
    setStopped(true);
  };
  const save = () => {
    const task = activities.find((item) => item.id === taskId);
    if (!task) return;
    const stamp = now();
    const minutes = mode === "offline"
      ? Math.max(0, Number(offlineDuration) || 0)
      : accumulated.current / 60_000;
    const focusStartedAt = mode === "offline" ? offlineStart : (startedAt.current || stamp);
    const focusEndedAt = mode === "offline" ? offlineEnd : stamp;
    if (!focusStartedAt || !focusEndedAt || minutes <= 0) return;
    mutate((current) => addFocus(current, {
      startedAt: focusStartedAt,
      endedAt: focusEndedAt,
      duration: minutes,
      focusOn: task.sourceTaskId ?? task.id,
      title: task.title,
      output: task.expectedOutput,
    }));
    onClose();
  };
  return (
    <Dialog
      open
      title={t("dashboard.focusTimer")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid justify-items-center gap-6">
        <Tabs
          value={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            if (nextMode === "offline" && !offlineStart) {
              const start = Date.now();
              setOfflineStart(formatLocalDateTime(start));
              setOfflineEnd(formatLocalDateTime(start + 60 * 60 * 1000));
              setOfflineDuration("60");
            }
          }}
          fullWidth
          items={[
            { value: "online", label: t("dashboard.focusOnline") },
            { value: "offline", label: t("dashboard.focusOffline") },
          ]}
        />
        {mode === "online" ? (
        <div className="grid size-64 place-items-center rounded-full border-[10px] border-zinc-100 shadow-inner dark:border-zinc-900">
          <div className="text-center">
            <p className="font-mono text-3xl font-semibold tabular-nums">{timerText(elapsed)}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {t(
                stopped
                  ? "dashboard.focusStopped"
                  : running
                    ? "dashboard.focusRunning"
                    : started
                      ? "dashboard.focusPaused"
                      : "dashboard.focusReady",
              )}
            </p>
          </div>
        </div>
        ) : (
          <div className="grid w-full gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("dashboard.focusStart")}>
                <Input type="datetime-local" value={offlineStart} onChange={(event) => setOfflineStart(event.target.value)} />
              </Field>
              <Field label={t("dashboard.focusEnd")}>
                <Input type="datetime-local" value={offlineEnd} onChange={(event) => setOfflineEnd(event.target.value)} />
              </Field>
            </div>
            <Field label={t("dashboard.focusDuration")}>
              <Input type="number" min="0" step="1" value={offlineDuration} onChange={(event) => setOfflineDuration(event.target.value)} />
            </Field>
          </div>
        )}
        {mode === "online" && !stopped ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={running ? pause : resume}>
              {running ? (
                <PauseIcon className="size-4" />
              ) : (
                <PlayIcon className="size-4" />
              )}
              {t(
                running
                  ? "dashboard.pauseFocus"
                  : started
                    ? "dashboard.resumeFocus"
                    : "dashboard.startFocusTimer",
              )}
            </Button>
            <Button disabled={!started} onClick={stop}>
              <StopIcon className="size-4" />
              {t("dashboard.stopFocus")}
            </Button>
            <Button variant="danger" onClick={onClose}>
              <XMarkIcon className="size-4" />
              {t("dashboard.cancelFocus")}
            </Button>
          </div>
        ) : mode === "online" ? (
          <TaskAssignment activities={activities} taskId={taskId} onChange={setTaskId} />
        ) : (
          <TaskAssignment activities={activities} taskId={taskId} onChange={setTaskId} />
        )}
        {(stopped || mode === "offline") && (
          <div className="flex justify-center gap-2">
            <Button disabled={!taskId || elapsed <= 0} onClick={save}>
              {t("dashboard.saveFocus")}
            </Button>
            <Button variant="danger" onClick={onClose}>
              {t("dashboard.cancelFocus")}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function TaskAssignment({
  activities,
  taskId,
  onChange,
}: {
  activities: DailyTask[];
  taskId: string;
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="w-full">
      <legend className="mb-2 text-sm font-medium">
        {t("dashboard.assignFocusTask")}
      </legend>
      <div className="grid max-h-52 gap-1 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
        {activities.map((task) => (
          <label
            key={task.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <input
              type="radio"
              name="focus-task"
              checked={taskId === task.id}
              onChange={() => onChange(task.id)}
            />
            <span className="min-w-0 truncate">{task.title}</span>
          </label>
        ))}
        {!activities.length && (
          <p className="p-3 text-sm text-zinc-500">
            {t("dashboard.noDailyTasks")}
          </p>
        )}
      </div>
    </fieldset>
  );
}
