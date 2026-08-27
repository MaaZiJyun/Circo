"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { TaskList } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";
import { useProjectTaskActions } from "./use-project-task-actions";

export const TASK_DEFAULT_LIST = "task_list_default";
export const TASK_FORMAL_LIST = "task_list_formal";
export const TASK_CASUAL_LIST = "task_list_casual";

export type TaskListInput = Pick<TaskList, "name" | "note" | "color">;
export type TaskSort = "createdAt" | "dueDate" | "importance" | "title" | "startDate";
export type TaskSortDirection = "ascending" | "descending";

export function useTaskLibrary() {
  const { state, mutate } = useStore();
  const taskActions = useProjectTaskActions();
  const [activeListId, setActiveListId] = useState(TASK_DEFAULT_LIST);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<TaskSort>("dueDate");
  const [sortDirection, setSortDirection] =
    useState<TaskSortDirection>("ascending");

  const lists = useMemo(
    () => (state ? activeItems(state.taskLists) : []),
    [state],
  );
  const projects = useMemo(
    () => (state ? activeItems(state.projects) : []),
    [state],
  );
  const allTasks = useMemo(
    () => (state ? activeItems(state.tasks) : []),
    [state],
  );
  const formalTasks = useMemo(
    () => allTasks.filter((task) => task.projectId),
    [allTasks],
  );
  const casualTasks = useMemo(
    () => allTasks.filter((task) => !task.projectId),
    [allTasks],
  );

  const tasks = useMemo(() => {
    const filtered =
      activeListId === TASK_DEFAULT_LIST
        ? allTasks
        : activeListId === TASK_FORMAL_LIST
          ? formalTasks
          : activeListId === TASK_CASUAL_LIST
            ? casualTasks
            : casualTasks.filter((task) =>
                (task.listIds ?? []).includes(activeListId),
              );
    const direction = sortDirection === "ascending" ? 1 : -1;
    return filtered.slice().sort((a, b) => {
      const comparison =
        sortBy === "importance"
          ? a.importance - b.importance
          : a[sortBy].localeCompare(b[sortBy]);
      return comparison * direction;
    });
  }, [activeListId, allTasks, formalTasks, casualTasks, sortBy, sortDirection]);

  const selectedList = lists.find((item) => item.id === activeListId);

  const selectList = (id: string) => {
    setActiveListId(id);
    setSelectedIds([]);
  };
  const toggleSelected = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const createList = (input: TaskListInput) => {
    const stamp = now();
    const list: TaskList = {
      id: createId("task_list"),
      ...input,
      system: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      taskLists: [...current.taskLists, list],
    }));
    selectList(list.id);
  };
  const updateList = (id: string, input: TaskListInput) =>
    mutate((current) => ({
      ...current,
      taskLists: current.taskLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, ...input, updatedAt: now() }
          : item,
      ),
    }));
  const deleteList = (id: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      taskLists: current.taskLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
      tasks: current.tasks.map((item) => ({
        ...item,
        listIds: (item.listIds ?? []).filter((listId) => listId !== id),
      })),
    }));
    selectList(TASK_DEFAULT_LIST);
  };
  const addToList = (ids: string[], listId: string) => {
    if (lists.find((item) => item.id === listId)?.system) return;
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        ids.includes(item.id) &&
        !item.projectId &&
        !(item.listIds ?? []).includes(listId)
          ? { ...item, listIds: [...(item.listIds ?? []), listId], updatedAt: now() }
          : item,
      ),
    }));
  };
  const removeFromList = (ids: string[]) => {
    if (selectedList?.system !== null) return;
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        ids.includes(item.id)
          ? {
              ...item,
              listIds: (item.listIds ?? []).filter((id) => id !== activeListId),
              updatedAt: now(),
            }
          : item,
      ),
    }));
  };
  const removeFromCurrentList = () => {
    removeFromList(selectedIds);
    setSelectedIds([]);
  };
  const deleteSelected = () => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        selectedIds.includes(item.id)
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
    }));
    setSelectedIds([]);
  };

  return {
    lists,
    projects,
    allTasks,
    formalTasks,
    casualTasks,
    tasks,
    selectedList,
    activeListId,
    selectList,
    selectedIds,
    setSelectedIds,
    toggleSelected,
    draggedIds,
    setDraggedIds,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromList,
    removeFromCurrentList,
    deleteSelected,
    ...taskActions,
  };
}
