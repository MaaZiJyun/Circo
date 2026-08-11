"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { LibraryList, SourceRecord } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

export const DEFAULT_LIST_ID = "library_default";
export const RECENT_LIST_ID = "library_recent";

export type LibraryListInput = Pick<
  LibraryList,
  "name" | "note" | "tags" | "color"
>;

export function useLibraryManagement() {
  const { state, mutate } = useStore();
  const [activeListId, setActiveListId] = useState(DEFAULT_LIST_ID);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const lists = useMemo(
    () => (state ? activeItems(state.libraryLists) : []),
    [state],
  );
  const allSources = useMemo(
    () => (state ? activeItems(state.sources) : []),
    [state],
  );
  const sources = useMemo(() => {
    const filtered =
      activeListId === DEFAULT_LIST_ID || activeListId === RECENT_LIST_ID
        ? allSources
        : allSources.filter((source) => source.listIds.includes(activeListId));
    return filtered
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [activeListId, allSources]);
  const selectedList = lists.find((item) => item.id === activeListId);

  const updateSource = (id: string, change: Partial<SourceRecord>) => {
    mutate((current) => ({
      ...current,
      sources: current.sources.map((item) =>
        item.id === id ? { ...item, ...change, updatedAt: now() } : item,
      ),
    }));
  };

  const createList = (input: LibraryListInput) => {
    const stamp = now();
    const list: LibraryList = {
      id: createId("library"),
      ...input,
      system: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      libraryLists: [...current.libraryLists, list],
    }));
    setActiveListId(list.id);
  };

  const deleteList = (id: string) => {
    const list = lists.find((item) => item.id === id);
    if (!list || list.system) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      libraryLists: current.libraryLists.map((item) =>
        item.id === id ? { ...item, deletedAt: stamp, updatedAt: stamp } : item,
      ),
      sources: current.sources.map((item) => ({
        ...item,
        listIds: item.listIds.filter((listId) => listId !== id),
      })),
    }));
    setActiveListId(DEFAULT_LIST_ID);
    setSelectedIds([]);
  };

  const addToList = (ids: string[], listId: string) => {
    if (!listId || listId === RECENT_LIST_ID) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      sources: current.sources.map((item) =>
        ids.includes(item.id) && !item.listIds.includes(listId)
          ? { ...item, listIds: [...item.listIds, listId], updatedAt: stamp }
          : item,
      ),
    }));
  };

  const removeFromCurrentList = () => {
    if (selectedList?.system !== null) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      sources: current.sources.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              listIds: item.listIds.filter((id) => id !== activeListId),
              updatedAt: stamp,
            }
          : item,
      ),
    }));
    setSelectedIds([]);
  };

  const deleteSelected = async () => {
    const targets = allSources.filter((item) => selectedIds.includes(item.id));
    const results = await Promise.all(
      targets
        .filter((item) => item.fileToken || item.markdownToken)
        .map((item) =>
          fetch("/api/library-files", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileToken: item.fileToken,
              markdownToken: item.markdownToken,
            }),
          }),
        ),
    );
    if (results.some((response) => !response.ok))
      throw new Error("Unable to delete one or more literature files.");
    mutate((current) => ({
      ...current,
      sources: current.sources.filter((item) => !selectedIds.includes(item.id)),
      annotations: current.annotations.filter(
        (item) => !selectedIds.includes(item.sourceId),
      ),
      relations: current.relations.filter(
        (item) =>
          !(item.fromKind === "source" && selectedIds.includes(item.fromId)) &&
          !(item.toKind === "source" && selectedIds.includes(item.toId)),
      ),
      ideas: current.ideas.map((item) => ({
        ...item,
        sourceIds: item.sourceIds.filter((id) => !selectedIds.includes(id)),
      })),
      logs: current.logs.map((item) => ({
        ...item,
        sourceIds: item.sourceIds.filter((id) => !selectedIds.includes(id)),
      })),
      artifacts: current.artifacts.map((item) => ({
        ...item,
        sourceIds: item.sourceIds.filter((id) => !selectedIds.includes(id)),
      })),
    }));
    setSelectedIds([]);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return {
    lists,
    sources,
    allSources,
    selectedList,
    activeListId,
    setActiveListId: (id: string) => {
      setActiveListId(id);
      setSelectedIds([]);
    },
    selectedIds,
    setSelectedIds,
    toggleSelected,
    updateSource,
    createList,
    deleteList,
    addToList,
    removeFromCurrentList,
    deleteSelected,
  };
}
