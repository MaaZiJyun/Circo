"use client";

import { useEffect, useRef, useState } from "react";
import {
  PauseIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Button, Dialog } from "@/shared/components/ui";
import { isDailyCacheCleared } from "@/shared/model/daily-cache";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { DailyTask, WorkSession } from "@/shared/model/entities";
import { createId, now, today } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

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

function parseTimerText(value: string) {
  const match = value
    .trim()
    .match(/^(\d{1,3}):([0-5]\d):([0-5]\d)\.(\d{1,3})$/);
  if (!match) return null;
  const milliseconds = Number(match[4].padEnd(3, "0"));
  return (
    Number(match[1]) * 3_600_000 +
    Number(match[2]) * 60_000 +
    Number(match[3]) * 1000 +
    milliseconds
  );
}

export function FocusTimerDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeDraft, setTimeDraft] = useState("");
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

  if (!state) return null;
  const currentDate = today();
  const tasks = state.dailyTasks.filter((task) => task.date === currentDate && !task.deletedAt && !isDailyCacheCleared(state, currentDate));
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
  const finishTimeEdit = () => {
    const parsed = parseTimerText(timeDraft);
    if (parsed !== null) {
      accumulated.current = parsed;
      setElapsed(parsed);
    }
    setEditingTime(false);
  };
  const save = () => {
    const task = tasks.find((item) => item.id === taskId);
    const cycle =
      state.cycles.find(
        (item) => !item.deletedAt && item.status === "active",
      ) ?? state.cycles.find((item) => !item.deletedAt);
    if (!task) return;
    const stamp = now();
    const minutes = accumulated.current / 60_000;
    const session: WorkSession | null = cycle
      ? {
          id: createId("session"),
          cycleId: cycle.id,
          projectId: task.projectId,
          taskId: task.sourceTaskId,
          title: task.title,
          startedAt: startedAt.current || stamp,
          endedAt: stamp,
          minutes,
          effective: true,
          focus: 4,
          output: task.expectedOutput,
          note: "",
          createdAt: stamp,
          updatedAt: stamp,
        }
      : null;
    mutate((current) => ({
      ...current,
      sessions: session ? [...current.sessions, session] : current.sessions,
      dailyTasks: current.dailyTasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              actualMinutes: (item.actualMinutes ?? 0) + minutes,
              updatedAt: stamp,
            }
          : item,
      ),
      tasks: task.sourceTaskId
        ? current.tasks.map((item) =>
            item.id === task.sourceTaskId
              ? {
                  ...item,
                  actualMinutes: (item.actualMinutes ?? 0) + minutes,
                  updatedAt: stamp,
                }
              : item,
          )
        : current.tasks,
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
        <div className="grid size-64 place-items-center rounded-full border-[10px] border-zinc-100 shadow-inner dark:border-zinc-900">
          <div className="text-center">
            {editingTime ? (
              <input
                autoFocus
                aria-label={t("dashboard.editFocusTime")}
                value={timeDraft}
                className="w-52 border-b border-zinc-300 bg-transparent text-center font-mono text-3xl font-semibold tabular-nums outline-none dark:border-zinc-700"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setTimeDraft(event.target.value)}
                onBlur={finishTimeEdit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") {
                    setTimeDraft(timerText(elapsed));
                    event.currentTarget.blur();
                  }
                }}
              />
            ) : (
              <button
                type="button"
                disabled={!stopped}
                title={stopped ? t("dashboard.editFocusTime") : undefined}
                className={`font-mono text-3xl font-semibold tabular-nums ${stopped ? "rounded-md underline decoration-dotted underline-offset-4" : "cursor-default"}`}
                onClick={() => {
                  setTimeDraft(timerText(elapsed));
                  setEditingTime(true);
                }}
              >
                {timerText(elapsed)}
              </button>
            )}
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
        {!stopped ? (
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
        ) : (
          <TaskAssignment tasks={tasks} taskId={taskId} onChange={setTaskId} />
        )}
        {stopped && (
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
  tasks,
  taskId,
  onChange,
}: {
  tasks: DailyTask[];
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
        {tasks.map((task) => (
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
        {!tasks.length && (
          <p className="p-3 text-sm text-zinc-500">
            {t("dashboard.noDailyTasks")}
          </p>
        )}
      </div>
    </fieldset>
  );
}
