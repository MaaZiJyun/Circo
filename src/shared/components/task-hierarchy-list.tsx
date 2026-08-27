"use client";

import { useRef, useState } from "react";
import type { ActivityRecord } from "@/shared/model/entities";
import { useI18n } from "@/shared/i18n/i18n-context";

export const taskHierarchyDragType = "application/x-circo-task";
const detachDistance = 18;

export function TaskHierarchyList({
  activities,
  selectedTaskIds = [],
  onSetParent,
  onDragStart,
  renderTask,
}: {
  activities: ActivityRecord[];
  selectedTaskIds?: string[];
  onSetParent: (ids: string[], parentId: string | null) => void;
  onDragStart?: (
    task: ActivityRecord,
    event: React.DragEvent<HTMLDivElement>,
  ) => void;
  renderTask: (task: ActivityRecord) => React.ReactNode;
}) {
  const { t } = useI18n();
  const [draggedTaskIds, setDraggedTaskIds] = useState<string[]>([]);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [detachIndicator, setDetachIndicator] = useState<{
    taskId: string;
    x: number;
    y: number;
  } | null>(null);
  const [joinIndicator, setJoinIndicator] = useState<{
    taskId: string;
    x: number;
    y: number;
  } | null>(null);
  const draggedIdsRef = useRef<string[]>([]);
  const dropHandledRef = useRef(false);
  const taskContainersRef = useRef(new Map<string, HTMLDivElement>());
  const { roots, children } = buildHierarchy(activities);
  const rendered = new Set<string>();

  if (!activities.length) return null;

  const clearDrag = () => {
    setDraggedTaskIds([]);
    setDragOverTaskId(null);
    setDetachIndicator(null);
    setJoinIndicator(null);
  };
  const readDraggedIds = (event: React.DragEvent<HTMLDivElement>) => {
    const value =
      event.dataTransfer.getData(taskHierarchyDragType) ||
      event.dataTransfer.getData("text/plain");
    try {
      return normalizeDraggedIds(JSON.parse(value) as unknown, activities);
    } catch {
      return draggedTaskIds.filter((id) => activities.some((task) => task.id === id));
    }
  };
  const startDrag = (task: ActivityRecord, event: React.DragEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, input, textarea, select, a")) {
      event.preventDefault();
      return;
    }
    const ids = selectedTaskIds.includes(task.id) ? selectedTaskIds : [task.id];
    draggedIdsRef.current = ids;
    dropHandledRef.current = false;
    setDraggedTaskIds(ids);
    event.dataTransfer.effectAllowed = "move";
    const payload = JSON.stringify(ids);
    event.dataTransfer.setData(taskHierarchyDragType, payload);
    event.dataTransfer.setData("text/plain", payload);
    onDragStart?.(task, event);
  };
  const setDropTarget = (task: ActivityRecord, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const ids = draggedTaskIds.length ? draggedTaskIds : readDraggedIds(event);
    if (isValidParentTarget(ids, task.id, activities)) {
      event.dataTransfer.dropEffect = "move";
      setDragOverTaskId(task.id);
      setJoinIndicator({
        taskId: task.id,
        x: event.clientX,
        y: event.clientY,
      });
    } else {
      setDragOverTaskId(null);
      setJoinIndicator(null);
    }
  };
  const dropOnTask = (task: ActivityRecord, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dropHandledRef.current = true;
    const ids = readDraggedIds(event).filter((id) => id !== task.id);
    if (isValidParentTarget(ids, task.id, activities)) onSetParent(ids, task.id);
    clearDrag();
  };
  const dropIntoChildren = (
    parentId: string,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dropHandledRef.current = true;
    const ids = readDraggedIds(event);
    if (ids.length) onSetParent(ids, parentId);
    clearDrag();
  };
  const dropOnRoot = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dropHandledRef.current = true;
    const ids = readDraggedIds(event);
    if (ids.length) onSetParent(ids, null);
    clearDrag();
  };
  const trackDetachDistance = (
    task: ActivityRecord,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    if ((!event.clientX && !event.clientY) || !task.parentId) return;
    const parentContainer = taskContainersRef.current.get(task.parentId);
    const ready =
      !!parentContainer &&
      distanceToRect(
        event.clientX,
        event.clientY,
        parentContainer.getBoundingClientRect(),
      ) >= detachDistance;
    setDetachIndicator(
      ready
        ? { taskId: task.id, x: event.clientX, y: event.clientY }
        : null,
    );
  };
  const finishDrag = (task: ActivityRecord, event: React.DragEvent<HTMLDivElement>) => {
    const hasPointerPosition = event.clientX !== 0 || event.clientY !== 0;
    const parentContainer = task.parentId
      ? taskContainersRef.current.get(task.parentId)
      : undefined;
    if (
      !dropHandledRef.current &&
      task.parentId &&
      hasPointerPosition &&
      parentContainer &&
      distanceToRect(event.clientX, event.clientY, parentContainer.getBoundingClientRect()) >=
        detachDistance
    ) {
      onSetParent(draggedIdsRef.current, null);
    }
    draggedIdsRef.current = [];
    dropHandledRef.current = false;
    clearDrag();
  };
  const renderNode = (task: ActivityRecord): React.ReactNode => {
    if (rendered.has(task.id)) return null;
    rendered.add(task.id);
    const nestedTasks = children.get(task.id) ?? [];
    const detachReady =
      detachIndicator?.taskId === task.id && !dragOverTaskId;
    return (
      <div
        key={task.id}
        ref={(node) => {
          if (node) taskContainersRef.current.set(task.id, node);
          else taskContainersRef.current.delete(task.id);
        }}
        className="rounded-2xl"
      >
        <div
          title={draggedTaskIds.length ? t("hand.dropToParent") : undefined}
          className={`flex items-start rounded-2xl border cursor-grab select-none transition-colors active:cursor-grabbing ${detachReady ? "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/35" : dragOverTaskId === task.id ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/35" : "border-transparent"}`}
          draggable
          onDragStart={(event) => startDrag(task, event)}
          onDrag={(event) => trackDetachDistance(task, event)}
          onDragEnter={(event) => setDropTarget(task, event)}
          onDragOver={(event) => setDropTarget(task, event)}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDragOverTaskId(null);
              setJoinIndicator(null);
            }
          }}
          onDrop={(event) => dropOnTask(task, event)}
          onDragEnd={(event) => finishDrag(task, event)}
        >
          <div className="min-w-0 flex-1">{renderTask(task)}</div>
        </div>
        {nestedTasks.length > 0 && (
          <div
            className="ml-6 space-y-2 pb-2 pl-3 pr-2"
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => dropIntoChildren(task.id, event)}
          >
            {nestedTasks.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="space-y-2 pb-2"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={dropOnRoot}
    >
      {detachIndicator && !dragOverTaskId && (
        <div
          className="pointer-events-none fixed z-[100] rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{
            left: detachIndicator.x + 16,
            top: detachIndicator.y + 16,
          }}
        >
          {t("hand.releaseToDetach")}
        </div>
      )}
      {joinIndicator && dragOverTaskId === joinIndicator.taskId && (
        <div
          className="pointer-events-none fixed z-[100] rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{
            left: joinIndicator.x + 16,
            top: joinIndicator.y + 16,
          }}
        >
          {t("hand.releaseToJoin")}
        </div>
      )}
      {roots.map(renderNode)}
    </div>
  );
}

function normalizeDraggedIds(value: unknown, activities: ActivityRecord[]) {
  if (!Array.isArray(value)) return [];
  const available = new Set(activities.map((task) => task.id));
  return value.filter(
    (id): id is string => typeof id === "string" && available.has(id),
  );
}

function isValidParentTarget(
  childIds: string[],
  parentId: string,
  activities: ActivityRecord[],
) {
  if (!childIds.length || childIds.includes(parentId)) return false;
  const byId = new Map(activities.map((task) => [task.id, task]));
  let current: string | undefined = parentId;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    if (childIds.includes(current)) return false;
    visited.add(current);
    current = byId.get(current)?.parentId;
  }
  return true;
}

function distanceToRect(x: number, y: number, rect: DOMRect) {
  const horizontal = Math.max(rect.left - x, 0, x - rect.right);
  const vertical = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(horizontal, vertical);
}

function buildHierarchy(activities: ActivityRecord[]) {
  const byId = new Map(activities.map((task) => [task.id, task]));
  const children = new Map<string, ActivityRecord[]>();
  activities.forEach((task) => {
    if (!task.parentId || !byId.has(task.parentId)) return;
    const siblings = children.get(task.parentId) ?? [];
    siblings.push(task);
    children.set(task.parentId, siblings);
  });
  const roots = activities.filter(
    (task) => !task.parentId || !byId.has(task.parentId),
  );
  const visited = new Set<string>();
  const markTree = (task: ActivityRecord) => {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    (children.get(task.id) ?? []).forEach(markTree);
  };
  roots.forEach(markTree);
  activities.forEach((task) => {
    if (!visited.has(task.id)) roots.push(task);
  });
  return { roots, children };
}
