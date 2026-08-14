"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { activeItems } from "@/shared/model/app-state";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";

const slotCount = 3;
const dragType = "application/x-circo-daily-task";

function slotsOf(value?: Array<string | null>) {
  return Array.from({ length: slotCount }, (_, index) => value?.[index] ?? null);
}

function elapsed(minutes: number) {
  const seconds = Math.floor(minutes * 60);
  const hours = Math.floor(seconds / 3600);
  const rest = seconds % 3600;
  return `${String(hours).padStart(2, "0")}:${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`;
}

export function CountdownTaskSlots() {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const [dragOver, setDragOver] = useState<number | null>(null);
  const slots = slotsOf(state?.profile.countdownTaskSlots);
  const slotKey = slots.join("|");
  const hasSlottedTasks = slots.some(Boolean);

  useEffect(() => {
    if (!hasSlottedTasks) return;
    let previous = Date.now();
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      const addedMinutes = (currentTime - previous) / 60_000;
      previous = currentTime;
      const stamp = new Date(currentTime).toISOString();
      mutate((current) => {
        const currentSlots = slotsOf(current.profile.countdownTaskSlots);
        const selected = new Set(currentSlots.filter((id): id is string => !!id));
        const validDailyTasks = current.dailyTasks.filter(
          (task) => selected.has(task.id) && !task.deletedAt && !task.completed,
        );
        const validIds = new Set(validDailyTasks.map((task) => task.id));
        const sourceIds = new Set(
          validDailyTasks.flatMap((task) =>
            task.sourceTaskId ? [task.sourceTaskId] : [],
          ),
        );
        return {
          ...current,
          profile: {
            ...current.profile,
            countdownTaskSlots: currentSlots.map((id) =>
              id && validIds.has(id) ? id : null,
            ),
          },
          dailyTasks: current.dailyTasks.map((task) =>
            validIds.has(task.id)
              ? {
                  ...task,
                  actualMinutes: task.actualMinutes + addedMinutes,
                  updatedAt: stamp,
                }
              : task,
          ),
          tasks: current.tasks.map((task) =>
            sourceIds.has(task.id) && task.status !== "done"
              ? {
                  ...task,
                  actualMinutes: task.actualMinutes + addedMinutes,
                  updatedAt: stamp,
                }
              : task,
          ),
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasSlottedTasks, mutate, slotKey]);

  if (!state) return null;
  const tasks = activeItems(state.dailyTasks);
  const assign = (index: number, dailyTaskId: string) => {
    const stamp = new Date().toISOString();
    mutate((current) => {
      const dailyTask = current.dailyTasks.find(
        (task) => task.id === dailyTaskId && !task.deletedAt && !task.completed,
      );
      if (!dailyTask) return current;
      const dailyById = new Map(current.dailyTasks.map((task) => [task.id, task]));
      const nextSlots = slotsOf(current.profile.countdownTaskSlots).map(
        (id) =>
          id === dailyTaskId ||
          (dailyTask.sourceTaskId &&
            dailyById.get(id ?? "")?.sourceTaskId === dailyTask.sourceTaskId)
            ? null
            : id,
      );
      const ejectedId = nextSlots[index];
      nextSlots[index] = dailyTaskId;
      const ejectedSourceId = current.dailyTasks.find(
        (task) => task.id === ejectedId,
      )?.sourceTaskId;
      return {
        ...current,
        profile: { ...current.profile, countdownTaskSlots: nextSlots },
        tasks: current.tasks.map((task) =>
          task.id === dailyTask.sourceTaskId && task.status !== "done"
            ? { ...task, status: "doing", updatedAt: stamp }
            : task.id === ejectedSourceId && task.status !== "done"
              ? { ...task, status: "todo", updatedAt: stamp }
              : task,
        ),
      };
    });
  };
  const eject = (index: number) => {
    const stamp = new Date().toISOString();
    mutate((current) => {
      const nextSlots = slotsOf(current.profile.countdownTaskSlots);
      const dailyTaskId = nextSlots[index];
      nextSlots[index] = null;
      const sourceTaskId = current.dailyTasks.find(
        (task) => task.id === dailyTaskId,
      )?.sourceTaskId;
      return {
        ...current,
        profile: { ...current.profile, countdownTaskSlots: nextSlots },
        tasks: current.tasks.map((task) =>
          task.id === sourceTaskId && task.status !== "done"
            ? { ...task, status: "todo", updatedAt: stamp }
            : task,
        ),
      };
    });
  };

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {slots.map((taskId, index) => {
        const task = tasks.find((item) => item.id === taskId);
        return (
          <div
            key={index}
            className={`relative min-h-24 rounded-xl border border-dashed p-3 transition-colors ${dragOver === index ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-zinc-300 dark:border-zinc-700"}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragOver(index);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(null);
              const id =
                event.dataTransfer.getData(dragType) ||
                event.dataTransfer.getData("text/plain");
              if (id) assign(index, id);
            }}
          >
            <p className="pr-6 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {t("dashboard.countdown.slot").replace(
                "{number}",
                String(index + 1),
              )}
            </p>
            {task ? (
              <>
                <button
                  className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-white"
                  aria-label={t("dashboard.countdown.ejectTask")}
                  onClick={() => eject(index)}
                >
                  <XMarkIcon className="size-4" />
                </button>
                <p className="mt-2 line-clamp-2 text-sm font-medium">
                  {task.title}
                </p>
                <p className="mt-2 font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
                  {t("me.actualTime")}: {elapsed(task.actualMinutes)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs text-zinc-400">
                {t("dashboard.countdown.slotEmpty")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
