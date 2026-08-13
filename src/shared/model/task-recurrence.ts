import type { TaskRecord, TaskRecurrence } from "./entities";
import { createId } from "./factories";

export function nextDeadline(deadline: string, recurrence: TaskRecurrence) {
  const [datePart, timePart] = deadline.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const next = new Date(year, month - 1, day);
  if (recurrence.unit === "day")
    next.setDate(next.getDate() + recurrence.interval);
  if (recurrence.unit === "week")
    next.setDate(next.getDate() + recurrence.interval * 7);
  if (recurrence.unit === "month")
    moveCalendarMonth(next, recurrence.interval);
  if (recurrence.unit === "year")
    moveCalendarMonth(next, recurrence.interval * 12);
  const nextDate = [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, "0"),
    String(next.getDate()).padStart(2, "0"),
  ].join("-");
  return timePart ? `${nextDate}T${timePart}` : nextDate;
}

function moveCalendarMonth(date: Date, months: number) {
  const targetDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  date.setDate(Math.min(targetDay, lastDay));
}

export function appendNextRecurringTask(
  tasks: TaskRecord[],
  completedTaskId: string,
  stamp: string,
) {
  const source = tasks.find((task) => task.id === completedTaskId);
  if (
    !source?.recurrence ||
    tasks.some((task) => task.recurrenceSourceId === source.id)
  )
    return tasks;
  return [
    ...tasks,
    {
      ...source,
      id: createId("task"),
      dueDate: nextDeadline(source.dueDate, source.recurrence),
      status: "todo" as const,
      actualMinutes: 0,
      completedAt: undefined,
      recurrenceSourceId: source.id,
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}
