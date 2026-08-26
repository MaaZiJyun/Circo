"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { IconButton } from "@/shared/components/ui";
import { activeItems } from "@/shared/model/app-state";
import { isDailyCacheCleared } from "@/shared/model/daily-cache";
import { today } from "@/shared/model/factories";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import {
  cachedElapsed,
  readCountdownTimeCache,
  type CountdownTimeCache,
  writeCountdownTimeCache,
} from "../model/countdown-time-cache";

const slotCount = 3;
const dragType = "application/x-circo-daily-task";

function slotsOf(value?: Array<string | null>) {
  return Array.from(
    { length: slotCount },
    (_, index) => value?.[index] ?? null,
  );
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
  const [timeCache, setTimeCache] = useState<CountdownTimeCache>({});
  const [clock, setClock] = useState<number | null>(null);
  const cacheRef = useRef<CountdownTimeCache>({});
  const slots = slotsOf(state?.profile.countdownTaskSlots);
  const currentDate = today();
  const cacheCleared = state ? isDailyCacheCleared(state, currentDate) : false;
  const visibleSlots = cacheCleared ? slotsOf() : slots;
  const dailyTasks = activeItems(state?.dailyTasks ?? []).filter(
    (task) =>
      task.date === currentDate &&
      state !== null &&
      !isDailyCacheCleared(state, currentDate),
  );
  const activeSlotKey = visibleSlots
    .filter((id): id is string => {
      const task = dailyTasks.find((item) => item.id === id);
      return !!task && !task.completed;
    })
    .join("|");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readCountdownTimeCache(Date.now());
      cacheRef.current = saved;
      setTimeCache(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeSlotKey) return;
    const update = () => {
      const currentTime = Date.now();
      setClock(currentTime);
      setTimeCache((current) => {
        const next = { ...current };
        let changed = false;
        for (const id of activeSlotKey.split("|")) {
          if (next[id]) continue;
          next[id] = { startedAt: currentTime, accumulatedSeconds: 0 };
          changed = true;
        }
        if (!changed) return current;
        cacheRef.current = next;
        writeCountdownTimeCache(next);
        return next;
      });
    };
    const initial = window.setTimeout(update, 0);
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [activeSlotKey]);

  if (!state) return null;
  const releaseCache = (dailyTaskId: string) => {
    const next = { ...cacheRef.current };
    delete next[dailyTaskId];
    cacheRef.current = next;
    setTimeCache(next);
    writeCountdownTimeCache(next);
  };
  const assign = (index: number, dailyTaskId: string) => {
    const stampDate = new Date();
    const stampTime = stampDate.getTime();
    const stamp = stampDate.toISOString();
    const displacedId =
      visibleSlots[index] && visibleSlots[index] !== dailyTaskId
        ? visibleSlots[index]
        : null;
    const displacedTask = dailyTasks.find((task) => task.id === displacedId);
    const displacedEnd = displacedTask?.completedAt
      ? Math.min(stampTime, Date.parse(displacedTask.completedAt))
      : stampTime;
    const displacedMinutes = displacedId
      ? cachedElapsed(cacheRef.current[displacedId], displacedEnd) / 60
      : 0;
    mutate((current) => {
      const dailyTask = current.dailyTasks.find(
        (task) => task.id === dailyTaskId && !task.deletedAt && !task.completed,
      );
      if (!dailyTask) return current;
      const nextSlots = slotsOf(current.profile.countdownTaskSlots).map((id) =>
        id === dailyTaskId ? null : id,
      );
      const ejectedId = nextSlots[index];
      nextSlots[index] = dailyTaskId;
      const ejectedSourceId = current.dailyTasks.find(
        (task) => task.id === ejectedId,
      )?.sourceTaskId;
      return {
        ...current,
        profile: { ...current.profile, countdownTaskSlots: nextSlots },
        dailyTasks: current.dailyTasks.map((task) =>
          task.id === ejectedId
            ? {
                ...task,
                actualMinutes: task.actualMinutes + displacedMinutes,
                updatedAt: stamp,
              }
            : task,
        ),
        tasks: current.tasks.map((task) => {
          if (task.id === dailyTask.sourceTaskId)
            return task.status === "done"
              ? task
              : {
                  ...task,
                  actualMinutes:
                    task.actualMinutes +
                    (task.id === ejectedSourceId ? displacedMinutes : 0),
                  status: "doing",
                  actualStartedAt: task.actualStartedAt ?? stamp,
                  updatedAt: stamp,
                };
          return task.id === ejectedSourceId
            ? {
                ...task,
                actualMinutes: task.actualMinutes + displacedMinutes,
                actualStartedAt: task.actualStartedAt ?? stamp,
                status: task.status === "done" ? "done" : "todo",
                updatedAt: stamp,
              }
            : task;
        }),
      };
    });
    const nextCache = { ...cacheRef.current };
    if (displacedId) delete nextCache[displacedId];
    nextCache[dailyTaskId] ??= {
      startedAt: stampTime,
      accumulatedSeconds: 0,
    };
    cacheRef.current = nextCache;
    setTimeCache(nextCache);
    writeCountdownTimeCache(nextCache);
  };
  const eject = (index: number) => {
    const stampDate = new Date();
    const stampTime = stampDate.getTime();
    const stamp = stampDate.toISOString();
    const selectedId = slots[index];
    if (!selectedId) return;
    const selectedTask = dailyTasks.find((task) => task.id === selectedId);
    const settlementTime = selectedTask?.completedAt
      ? Math.min(stampTime, Date.parse(selectedTask.completedAt))
      : stampTime;
    const cachedMinutes =
      cachedElapsed(cacheRef.current[selectedId], settlementTime) / 60;
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
        dailyTasks: current.dailyTasks.map((task) =>
          task.id === dailyTaskId
            ? {
                ...task,
                actualMinutes: task.actualMinutes + cachedMinutes,
                updatedAt: stamp,
              }
            : task,
        ),
        tasks: current.tasks.map((task) =>
          task.id === sourceTaskId
            ? {
                ...task,
                actualMinutes: task.actualMinutes + cachedMinutes,
                actualStartedAt: task.actualStartedAt ?? stamp,
                status: task.status === "done" ? "done" : "todo",
                updatedAt: stamp,
              }
            : task,
        ),
      };
    });
    releaseCache(selectedId);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {visibleSlots.map((taskId, index) => {
        const task = dailyTasks.find((item) => item.id === taskId);
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
                <IconButton
                  size="xs"
                  label={t("dashboard.countdown.ejectTask")}
                  className="absolute right-2 top-2"
                  onClick={() => eject(index)}
                >
                  <XMarkIcon className="size-4" />
                </IconButton>
                <p className="text-center mt-2 line-clamp-2 text-sm font-medium">
                  {task.title.toUpperCase()}
                </p>
                <p className="text-center mt-1 font-mono text-base tabular-nums text-zinc-600 dark:text-zinc-400">
                  {elapsed(
                    task.actualMinutes +
                      cachedElapsed(
                        timeCache[task.id],
                        task.completedAt
                          ? Math.min(
                              clock ?? Date.parse(task.completedAt),
                              Date.parse(task.completedAt),
                            )
                          : (clock ?? timeCache[task.id]?.startedAt ?? 0),
                      ) /
                        60,
                  )}
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
