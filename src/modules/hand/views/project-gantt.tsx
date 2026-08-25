"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import { formatLocalDateTime } from "@/shared/model/factories";
import type { TaskRecord } from "@/shared/model/entities";
import {
  DAY,
  HOUR,
  ROW_HEIGHT,
  buildGanttRows,
  buildOverallRange,
  buildTicks,
  clamp,
  createsDependencyCycle,
  isTaskDescendant,
  periodRange,
  roundTo,
  schedulePatch,
  stepPeriod,
  type GanttRow,
  type GanttScale,
} from "../model/gantt-layout";
import type { GanttTaskPatch } from "../view-models/use-project-task-actions";
import { useCurrentTime } from "../view-models/use-current-time";
import { ProjectGanttCanvas } from "../widgets/project-gantt-canvas";
import { ProjectGanttHeader } from "../widgets/project-gantt-header";
import { ProjectGanttTitles } from "../widgets/project-gantt-titles";
import { TaskGanttInspector } from "../widgets/task-gantt-inspector";

type DragMode = "move" | "start" | "end";
type DragState = {
  taskId: string;
  mode: DragMode;
  pointerX: number;
  start: number;
  end: number;
};
type Preview = { taskId: string; start: number; end: number } | null;

export function ProjectGantt({
  tasks,
  startDate,
  endDate,
  onUpdateTask,
  onCreateTask,
}: {
  tasks: TaskRecord[];
  startDate: string;
  endDate: string;
  onUpdateTask: (id: string, patch: GanttTaskPatch) => void;
  onCreateTask: (startAt: string) => void;
}) {
  const { t, locale } = useI18n();
  const { currentTime, refresh: refreshCurrentTime } = useCurrentTime();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const [scale, setScale] = useState<GanttScale>("overall");
  const [anchor, setAnchor] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(900);
  const [preview, setPreview] = useState<Preview>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const rows = useMemo(
    () => buildGanttRows(tasks, startDate, endDate),
    [tasks, startDate, endDate],
  );
  const overallRange = useMemo(
    () => buildOverallRange(rows, startDate, endDate),
    [rows, startDate, endDate],
  );
  const range = scale === "overall" ? overallRange : periodRange(scale, anchor);
  const duration = Math.max(HOUR, range.end - range.start);
  const baseWidth =
    scale === "day"
      ? Math.max(viewportWidth, 24 * 72)
      : scale === "week"
        ? Math.max(viewportWidth, 7 * 112)
        : scale === "month"
          ? Math.max(viewportWidth, (duration / DAY) * 34)
          : viewportWidth;
  const chartWidth = Math.max(viewportWidth, Math.round(baseWidth * zoom));
  const totalHeight = Math.max(rows.length * ROW_HEIGHT, 104);
  const ticks = buildTicks(scale, range.start, range.end, locale);
  const toX = (value: number) =>
    ((value - range.start) / duration) * chartWidth;
  const todayX =
    currentTime !== null &&
    currentTime >= range.start &&
    currentTime <= range.end
      ? toX(currentTime)
      : null;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setViewportWidth(Math.max(320, element.clientWidth)),
    );
    observer.observe(element);
    setViewportWidth(Math.max(320, element.clientWidth));
    return () => observer.disconnect();
  }, []);

  const changeScale = (next: GanttScale) => {
    setScale(next);
    setZoom(1);
    if (next !== "overall") {
      const referenceTime = currentTime ?? overallRange.start;
      setAnchor(
        referenceTime >= overallRange.start && referenceTime <= overallRange.end
          ? referenceTime
          : overallRange.start,
      );
    }
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ left: 0 }));
  };
  const fit = () => {
    setScale("overall");
    setZoom(1);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" }),
    );
  };
  const jumpToToday = () => {
    const now = refreshCurrentTime();
    if (now < range.start || now > range.end) {
      setScale("day");
      setAnchor(now);
      setZoom(1);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ left: 0 }));
      return;
    }
    requestAnimationFrame(() => {
      const element = scrollRef.current;
      element?.scrollTo({
        left: Math.max(0, toX(now) - element.clientWidth / 2),
        behavior: "smooth",
      });
    });
  };
  const changeZoom = (delta: number) =>
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), 0.5, 4));
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    changeZoom(event.deltaY > 0 ? -0.15 : 0.15);
  };

  const beginDrag = (
    event: ReactPointerEvent<HTMLElement>,
    row: GanttRow,
    mode: DragMode,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      taskId: row.task.id,
      mode,
      pointerX: event.clientX,
      start: row.start,
      end: row.end,
    };
    didDragRef.current = false;
  };
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rawDelta = ((event.clientX - drag.pointerX) / chartWidth) * duration;
    const snap = scale === "day" ? 15 * 60_000 : DAY;
    const delta = Math.round(rawDelta / snap) * snap;
    if (delta !== 0) didDragRef.current = true;
    const minimum = scale === "day" ? 15 * 60_000 : HOUR;
    const next = dragPreview(drag, delta, minimum);
    setPreview({ taskId: drag.taskId, ...next });
  };
  const finishDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag && preview && preview.taskId === drag.taskId && didDragRef.current)
      onUpdateTask(drag.taskId, schedulePatch(preview.start, preview.end));
    setPreview(null);
  };
  const createDependency = (sourceId: string, target: TaskRecord) => {
    const source = tasks.find((task) => task.id === sourceId);
    if (
      !source ||
      sourceId === target.id ||
      source.projectId !== target.projectId ||
      isTaskDescendant(tasks, sourceId, target.id) ||
      target.dependencyIds.includes(sourceId) ||
      createsDependencyCycle(tasks, sourceId, target.id)
    )
      return;
    onUpdateTask(target.id, {
      dependencyIds: [...target.dependencyIds, sourceId],
    });
  };
  const createAtPosition = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-task-bar]")) return;
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const value = range.start + (x / chartWidth) * duration;
    onCreateTask(
      formatLocalDateTime(roundTo(value, scale === "day" ? HOUR : DAY)),
    );
  };

  return (
    <section className="relative mb-5 overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <ProjectGanttHeader
        scale={scale}
        zoom={zoom}
        onScale={changeScale}
        onPrevious={() =>
          scale !== "overall" && setAnchor(stepPeriod(scale, anchor, -1))
        }
        onNext={() =>
          scale !== "overall" && setAnchor(stepPeriod(scale, anchor, 1))
        }
        onToday={jumpToToday}
        onFit={fit}
        onZoom={changeZoom}
      />
      <div className="grid min-w-0 grid-cols-[minmax(210px,30%)_minmax(0,70%)]">
        <ProjectGanttTitles
          rows={rows}
          selectedId={selectedTaskId}
          onSelect={setSelectedTaskId}
        />
        <ProjectGanttCanvas
          scrollRef={scrollRef}
          rows={rows}
          ticks={ticks}
          range={range}
          chartWidth={chartWidth}
          totalHeight={totalHeight}
          todayX={todayX}
          preview={preview}
          toX={toX}
          onWheel={handleWheel}
          onDoubleClick={createAtPosition}
          onPointerMove={moveDrag}
          onPointerEnd={finishDrag}
          onBeginDrag={beginDrag}
          onTaskClick={(id) => {
            if (!didDragRef.current) setSelectedTaskId(id);
            didDragRef.current = false;
          }}
          onCreateDependency={createDependency}
        />
      </div>
      <footer className="flex items-center gap-3 border-t border-zinc-200/70 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-800">
        <span>{t("hand.ganttInteractionHint")}</span>
        <span className="ml-auto tabular-nums">
          {t("hand.ganttTaskCount").replace("{count}", String(rows.length))}
        </span>
      </footer>
      {selectedTask && (
        <TaskGanttInspector
          key={selectedTask.id}
          task={selectedTask}
          tasks={tasks}
          onClose={() => setSelectedTaskId(null)}
          onSave={(patch) => {
            onUpdateTask(selectedTask.id, patch);
            setSelectedTaskId(null);
          }}
        />
      )}
    </section>
  );
}

function dragPreview(drag: DragState, delta: number, minimum: number) {
  if (drag.mode === "move")
    return { start: drag.start + delta, end: drag.end + delta };
  if (drag.mode === "start")
    return {
      start: Math.min(drag.start + delta, drag.end - minimum),
      end: drag.end,
    };
  return {
    start: drag.start,
    end: Math.max(drag.end + delta, drag.start + minimum),
  };
}
