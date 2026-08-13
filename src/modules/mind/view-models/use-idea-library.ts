"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { IdeaList } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

const DEFAULT_ID = "idea_list_default";
const RECENT_ID = "idea_list_recent";
const week = 604800000;
export type IdeaListInput = Pick<IdeaList, "name" | "note" | "color">;

export function useIdeaLibrary() {
  const { state, mutate } = useStore();
  const [activeListId, setActiveListId] = useState(DEFAULT_ID);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [recentCutoff] = useState(() => Date.now() - week);
  const lists = useMemo(
    () => (state ? activeItems(state.ideaLists) : []),
    [state],
  );
  const allIdeas = useMemo(
    () => (state ? activeItems(state.ideas) : []),
    [state],
  );
  const recentIdeas = useMemo(
    () => allIdeas.filter((item) => Date.parse(item.createdAt) >= recentCutoff),
    [allIdeas, recentCutoff],
  );
  const ideas = useMemo(
    () =>
      activeListId === DEFAULT_ID
        ? allIdeas
        : activeListId === RECENT_ID
          ? recentIdeas
          : allIdeas.filter((item) => item.listIds.includes(activeListId)),
    [activeListId, allIdeas, recentIdeas],
  );
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
  const createList = (input: IdeaListInput) => {
    const stamp = now();
    const list: IdeaList = {
      id: createId("idea_list"),
      ...input,
      system: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      ideaLists: [...current.ideaLists, list],
    }));
    selectList(list.id);
  };
  const updateList = (id: string, input: IdeaListInput) =>
    mutate((current) => ({
      ...current,
      ideaLists: current.ideaLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, ...input, updatedAt: now() }
          : item,
      ),
    }));
  const deleteList = (id: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      ideaLists: current.ideaLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
      ideas: current.ideas.map((item) => ({
        ...item,
        listIds: item.listIds.filter((listId) => listId !== id),
      })),
    }));
    selectList(DEFAULT_ID);
  };
  const addToList = (ids: string[], listId: string) => {
    if (lists.find((item) => item.id === listId)?.system) return;
    mutate((current) => ({
      ...current,
      ideas: current.ideas.map((item) =>
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
      ideas: current.ideas.map((item) =>
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
      ideas: current.ideas.map((item) =>
        selectedIds.includes(item.id)
          ? { ...item, deletedAt: stamp, updatedAt: stamp }
          : item,
      ),
    }));
    setSelectedIds([]);
  };
  return {
    lists,
    allIdeas,
    recentIdeas,
    ideas,
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
