"use client";

import { useI18n } from "@/shared/i18n/i18n-context";
import type { MatrixFormulaSettings } from "@/shared/model/app-state";
import type { DailyTask } from "@/shared/model/entities";
import {
  adjustQuadrantDispersion,
  matrixBubble,
  resolveMatrixFormulas,
} from "../model/matrix-formula";
import { quadrantAxis, type TaskCoordinates } from "../model/task-quadrant";

const bubbleColors: Record<
  TaskCoordinates["quadrant"],
  [number, number, number]
> = {
  do: [220, 38, 38],
  schedule: [202, 138, 4],
  delegate: [22, 163, 74],
  eliminate: [37, 99, 235],
};
export function TaskQuadrant({
  activities,
  coordinates,
  formulas,
}: {
  activities: DailyTask[];
  coordinates: (task: DailyTask) => TaskCoordinates;
  formulas?: MatrixFormulaSettings;
}) {
  const { t } = useI18n();
  const activeTasks = activities.filter((task) => !task.completed);
  const taskPoints = activeTasks.map((task) => ({
    task,
    point: coordinates(task),
  }));
  const maximumEffort = Math.max(
    1,
    ...taskPoints.map(({ point }) => point.effort),
  );
  const maximumPriority = Math.max(
    1,
    ...taskPoints.map(({ point }) => point.priority),
  );
  const selectedFormulas = resolveMatrixFormulas(formulas);
  const points = adjustQuadrantDispersion(
    taskPoints.map(({ task, point }) => {
      const bubble = matrixBubble(task, point, maximumEffort, selectedFormulas);
      return {
        task,
        point,
        bubble,
        quadrant: point.quadrant,
        x: bubble.x,
        y: bubble.y,
      };
    }),
    1,
  )
    .map((item) => ({
      ...item,
      bubble: { ...item.bubble, x: item.x, y: item.y },
    }))
    .sort((a, b) => b.bubble.diameter - a.bubble.diameter);
  const urgencyAxis = quadrantAxis(points.map(({ bubble }) => bubble.x));
  const importanceAxis = quadrantAxis(points.map(({ bubble }) => bubble.y));
  const splitX = urgencyAxis.threshold;
  const splitY = importanceAxis.threshold;
  return (
    <div className="relative h-[clamp(560px,68vh,760px)] overflow-hidden rounded-2xl">
      <QuadrantBackground splitX={splitX} splitY={splitY} />
      <span className="absolute left-3 top-3 text-xs font-semibold text-yellow-600">
        {t("me.quadrant.schedule")}
      </span>
      <span className="absolute right-3 top-3 text-xs font-semibold text-red-600">
        {t("me.quadrant.do")}
      </span>
      <span className="absolute bottom-3 left-3 text-xs font-semibold text-blue-600">
        {t("me.quadrant.eliminate")}
      </span>
      <span className="absolute bottom-3 right-3 text-xs font-semibold text-green-600">
        {t("me.quadrant.delegate")}
      </span>
      {points.map(({ task, point, bubble }) => {
        const diameter = bubble.diameter;
        const radius = diameter / 2;
        const color = bubbleColors[point.quadrant];
        const intensity = Math.min(1, point.priority / maximumPriority);
        return (
          <span
            key={task.id}
            title={`${task.title}\n${t("me.urgency")}: ${point.urgency}\n${t("me.importance")}: ${point.importance}\nPriority: ${point.priority}\nEffort: ${point.effort}`}
            className="group absolute flex -translate-x-1/2 translate-y-1/2 items-center justify-center overflow-hidden rounded-full p-2 text-center text-xs font-medium leading-tight text-white transition-transform duration-300 ease-out hover:scale-125"
            style={{
              width: diameter,
              height: diameter,
              zIndex: Math.max(1, Math.round(220 - diameter)),
              left: `clamp(${radius}px, ${urgencyAxis.position(bubble.x)}%, calc(100% - ${radius}px))`,
              bottom: `clamp(${radius}px, ${importanceAxis.position(bubble.y)}%, calc(100% - ${radius}px))`,
              backgroundColor: `rgba(${color.join(",")},${0.16 + intensity * 0.7})`,
            }}
          >
            <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
            <span className="relative z-10 grid max-w-full gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="line-clamp-2 break-words font-semibold">
                {task.title}
              </span>
              <span className="truncate text-[10px] font-normal text-white/80">
                {t("me.taskDueAt")} ·{" "}
                {task.dueAt.replace("T", " ").slice(0, 16) || "—"}
              </span>
            </span>
          </span>
        );
      })}
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400">
        {t("me.urgency")} →
      </span>
      <span className="absolute left-2 top-1/2 origin-left -rotate-90 text-[10px] text-zinc-400">
        {t("me.importance")} →
      </span>
    </div>
  );
}

function QuadrantBackground({
  splitX,
  splitY,
}: {
  splitX: number;
  splitY: number;
}) {
  const horizontal = { left: `${splitX}%` };
  const vertical = { bottom: `${splitY}%` };
  return (
    <div className="absolute inset-0">
      <div
        className="absolute m-1 left-0 top-0 bg-yellow-50 dark:bg-yellow-950/30"
        style={{ right: `${100 - splitX}%`, ...vertical }}
      />
      <div
        className="absolute m-1 right-0 top-0 bg-red-50 dark:bg-red-950/30"
        style={{ ...horizontal, ...vertical }}
      />
      <div
        className="absolute m-1 bottom-0 left-0 bg-blue-50 dark:bg-blue-950/30"
        style={{ right: `${100 - splitX}%`, top: `${100 - splitY}%` }}
      />
      <div
        className="absolute m-1 bottom-0 right-0 bg-green-50 dark:bg-green-950/30"
        style={{ ...horizontal, top: `${100 - splitY}%` }}
      />
    </div>
  );
}
