import { ROW_HEIGHT, type GanttRow } from "../model/gantt-layout";

export function ProjectGanttDependencies({
  rows,
  toX,
  width,
  height,
  preview,
}: {
  rows: GanttRow[];
  toX: (value: number) => number;
  width: number;
  height: number;
  preview: { taskId: string; start: number; end: number } | null;
}) {
  const byId = new Map(rows.map((row, index) => [row.task.id, { row, index }]));
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[5]"
      width={width}
      height={height}
    >
      <defs>
        <marker
          id="gantt-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path
            d="M0 0 8 4 0 8z"
            className="fill-zinc-400 dark:fill-zinc-600"
          />
        </marker>
      </defs>
      {rows.flatMap((target, targetIndex) =>
        target.task.dependencyIds.flatMap((dependencyId) => {
          const source = byId.get(dependencyId);
          if (!source) return [];
          const x1 = toX(
            preview?.taskId === dependencyId ? preview.end : source.row.end,
          );
          const x2 = toX(
            preview?.taskId === target.task.id ? preview.start : target.start,
          );
          if (x1 < 0 || x1 > width || x2 < 0 || x2 > width) return [];
          const y1 = source.index * ROW_HEIGHT + ROW_HEIGHT / 2;
          const y2 = targetIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
          const elbow = x1 + Math.max(12, Math.min(32, (x2 - x1) / 2));
          return (
            <path
              key={`${dependencyId}-${target.task.id}`}
              d={`M${x1} ${y1}H${elbow}V${y2}H${x2 - 4}`}
              fill="none"
              className="stroke-zinc-400 dark:stroke-zinc-600"
              strokeWidth="1.25"
              markerEnd="url(#gantt-arrow)"
            />
          );
        }),
      )}
    </svg>
  );
}
