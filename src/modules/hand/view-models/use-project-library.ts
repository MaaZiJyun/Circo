"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { ProjectList } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

export const PROJECT_DEFAULT_LIST = "project_list_default";
export const PROJECT_RECENT_LIST = "project_list_recent";
const recentWindow = 7 * 24 * 60 * 60 * 1000;

export type ProjectListInput = Pick<ProjectList, "name" | "note" | "color">;

export function useProjectLibrary() {
  const { state, mutate } = useStore();
  const [activeListId, setActiveListId] = useState(PROJECT_DEFAULT_LIST);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [recentCutoff] = useState(() => Date.now() - recentWindow);
  const lists = useMemo(
    () => (state ? activeItems(state.projectLists) : []),
    [state],
  );
  const allProjects = useMemo(
    () =>
      state
        ? activeItems(state.projects)
            .slice()
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        : [],
    [state],
  );
  const recentProjects = useMemo(
    () =>
      allProjects.filter((item) => Date.parse(item.createdAt) >= recentCutoff),
    [allProjects, recentCutoff],
  );
  const projects = useMemo(() => {
    if (activeListId === PROJECT_DEFAULT_LIST) return allProjects;
    if (activeListId === PROJECT_RECENT_LIST) return recentProjects;
    return allProjects.filter((item) => item.listIds.includes(activeListId));
  }, [activeListId, allProjects, recentProjects]);
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
  const createList = (input: ProjectListInput) => {
    const stamp = now();
    const list: ProjectList = {
      id: createId("project_list"),
      ...input,
      system: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      projectLists: [...current.projectLists, list],
    }));
    selectList(list.id);
  };
  const updateList = (id: string, input: ProjectListInput) =>
    mutate((current) => ({
      ...current,
      projectLists: current.projectLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, ...input, updatedAt: now() }
          : item,
      ),
    }));
  const deleteList = (id: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      projectLists: current.projectLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
      projects: current.projects.map((item) => ({
        ...item,
        listIds: item.listIds.filter((listId) => listId !== id),
      })),
    }));
    selectList(PROJECT_DEFAULT_LIST);
  };
  const addToList = (ids: string[], listId: string) => {
    if (lists.find((item) => item.id === listId)?.system) return;
    mutate((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        ids.includes(item.id) && !item.listIds.includes(listId)
          ? { ...item, listIds: [...item.listIds, listId], updatedAt: now() }
          : item,
      ),
    }));
  };
  const removeFromCurrentList = () => {
    if (selectedList?.system !== null) return;
    mutate((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              listIds: item.listIds.filter((id) => id !== activeListId),
              updatedAt: now(),
            }
          : item,
      ),
    }));
    setSelectedIds([]);
  };
  const deleteSelected = () => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      projects: current.projects.map((item) =>
        selectedIds.includes(item.id)
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
    }));
    setSelectedIds([]);
  };

  return {
    lists,
    allProjects,
    recentProjects,
    projects,
    selectedList,
    activeListId,
    selectList,
    selectedIds,
    setSelectedIds,
    toggleSelected,
    draggedIds,
    setDraggedIds,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromCurrentList,
    deleteSelected,
  };
}
