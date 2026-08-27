"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { ActivityList } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";
import { useProjectTaskActions } from "./use-project-task-actions";

export const TASK_DEFAULT_LIST = "task_list_default";
export const TASK_FORMAL_LIST = "task_list_formal";
export const TASK_CASUAL_LIST = "task_list_casual";
export const TASK_ARCHIVED_LIST = "task_list_archived";

export type ActivityListInput = Pick<ActivityList, "name" | "note" | "color">;
export type ActivitySort = "createdAt" | "dueDate" | "importance" | "title" | "startDate";
export type ActivitySortDirection = "ascending" | "descending";

export function useTaskLibrary() {
  const { state, mutate } = useStore();
  const taskActions = useProjectTaskActions();
  const [activeListId, setActiveListId] = useState(TASK_DEFAULT_LIST);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<ActivitySort>("dueDate");
  const [sortDirection, setSortDirection] =
    useState<ActivitySortDirection>("ascending");

  const lists = useMemo(
    () => (state ? activeItems(state.activityLists) : []),
    [state],
  );
  const projects = useMemo(
    () => (state ? activeItems(state.projects) : []),
    [state],
  );
  const allActivities = useMemo(
    () => (state ? activeItems(state.activities) : []),
    [state],
  );
  const currentActivities = useMemo(
    () => allActivities.filter((activity) => !activity.archivedAt),
    [allActivities],
  );
  const archivedActivities = useMemo(
    () => allActivities.filter((activity) => Boolean(activity.archivedAt)),
    [allActivities],
  );
  const formalTasks = useMemo(
    () => currentActivities.filter((activity) => activity.projectId),
    [currentActivities],
  );
  const casualTasks = useMemo(
    () => currentActivities.filter((activity) => !activity.projectId),
    [currentActivities],
  );

  const activities = useMemo(() => {
    const filtered =
      activeListId === TASK_DEFAULT_LIST
        ? currentActivities
        : activeListId === TASK_FORMAL_LIST
          ? formalTasks
          : activeListId === TASK_CASUAL_LIST
            ? casualTasks
            : activeListId === TASK_ARCHIVED_LIST
              ? archivedActivities
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
  }, [activeListId, currentActivities, archivedActivities, formalTasks, casualTasks, sortBy, sortDirection]);

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

  const createList = (input: ActivityListInput) => {
    const stamp = now();
    const list: ActivityList = {
      id: createId("task_list"),
      ...input,
      system: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      activityLists: [...current.activityLists, list],
    }));
    selectList(list.id);
  };
  const updateList = (id: string, input: ActivityListInput) =>
    mutate((current) => ({
      ...current,
      activityLists: current.activityLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, ...input, updatedAt: now() }
          : item,
      ),
    }));
  const deleteList = (id: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      activityLists: current.activityLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
      activities: current.activities.map((item) => ({
        ...item,
        listIds: item.archivedAt
          ? item.listIds
          : (item.listIds ?? []).filter((listId) => listId !== id),
      })),
    }));
    selectList(TASK_DEFAULT_LIST);
  };
  const addToList = (ids: string[], listId: string) => {
    if (lists.find((item) => item.id === listId)?.system) return;
    mutate((current) => ({
      ...current,
      activities: current.activities.map((item) =>
        ids.includes(item.id) && !item.archivedAt &&
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
      activities: current.activities.map((item) =>
        ids.includes(item.id) && !item.archivedAt
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
      activities: current.activities.map((item) =>
        selectedIds.includes(item.id) && !item.archivedAt
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
    }));
    setSelectedIds([]);
  };

  return {
    lists,
    projects,
    allTasks: currentActivities,
    allActivities,
    archivedActivities,
    formalTasks,
    casualTasks,
    activities,
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
