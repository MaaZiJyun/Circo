"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { LibraryList, SourceRecord } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

export const DEFAULT_LIST_ID = "library_default";
export const RECENT_LIST_ID = "library_recent";
export const MARKED_LIST_ID = "library_marked";
const recentWindowMs = 7 * 24 * 60 * 60 * 1000;

export function isRecentlyAdded(createdAt: string, timestamp = Date.now()) {
  const created = Date.parse(createdAt);
  return Number.isFinite(created) && created >= timestamp - recentWindowMs;
}

export type LibraryListInput = Pick<
  LibraryList,
  "name" | "note" | "tags" | "color"
>;
export type LiteratureSort = "addedAt" | "publicationDate" | "rating";
export type SortDirection = "ascending" | "descending";

export function useLibraryManagement() {
  const { state, mutate } = useStore();
  const [activeListId, setActiveListId] = useState(DEFAULT_LIST_ID);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<LiteratureSort>("addedAt");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("descending");
  const lists = useMemo(
    () => (state ? activeItems(state.libraryLists) : []),
    [state],
  );
  const allSources = useMemo(
    () => (state ? activeItems(state.sources) : []),
    [state],
  );
  const recentSources = useMemo(
    () => allSources.filter((source) => isRecentlyAdded(source.createdAt)),
    [allSources],
  );
  const sources = useMemo(() => {
    const filtered =
      activeListId === DEFAULT_LIST_ID
        ? allSources
        : activeListId === RECENT_LIST_ID
          ? recentSources
          : activeListId === MARKED_LIST_ID
            ? allSources.filter((source) => source.favorite)
            : allSources.filter((source) =>
                source.listIds.includes(activeListId),
              );
    const direction = sortDirection === "ascending" ? 1 : -1;
    return filtered.slice().sort((a, b) => {
      const comparison =
        sortBy === "rating"
          ? a.rating - b.rating
          : sortBy === "publicationDate"
            ? a.publicationDate.localeCompare(b.publicationDate)
            : a.createdAt.localeCompare(b.createdAt);
      return comparison * direction;
    });
  }, [activeListId, allSources, recentSources, sortBy, sortDirection]);
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

  const updateList = (id: string, change: LibraryListInput) => {
    mutate((current) => ({
      ...current,
      libraryLists: current.libraryLists.map((item) =>
        item.id === id && !item.system
          ? { ...item, ...change, updatedAt: now() }
          : item,
      ),
    }));
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
    const target = lists.find((item) => item.id === listId);
    if (!target || target.system) return;
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

  const removeFromList = (ids: string[]) => {
    if (selectedList?.system !== null) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      sources: current.sources.map((item) =>
        ids.includes(item.id)
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

  const removeFromCurrentList = () => removeFromList(selectedIds);

  const deleteSources = async (ids: string[]) => {
    const targets = allSources.filter((item) => ids.includes(item.id));
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
      sources: current.sources.filter((item) => !ids.includes(item.id)),
      annotations: current.annotations.filter(
        (item) => !ids.includes(item.sourceId),
      ),
      relations: current.relations.filter(
        (item) =>
          !(item.fromKind === "source" && ids.includes(item.fromId)) &&
          !(item.toKind === "source" && ids.includes(item.toId)),
      ),
      ideas: current.ideas.map((item) => ({
        ...item,
        sourceIds: item.sourceIds.filter((id) => !ids.includes(id)),
      })),
      logs: current.logs.map((item) => ({
        ...item,
        sourceIds: item.sourceIds.filter((id) => !ids.includes(id)),
      })),
      artifacts: current.artifacts.map((item) => ({
        ...item,
        sourceIds: item.sourceIds.filter((id) => !ids.includes(id)),
      })),
    }));
    setSelectedIds([]);
  };
  const deleteSelected = () => deleteSources(selectedIds);

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
    recentSources,
    selectedList,
    activeListId,
    setActiveListId: (id: string) => {
      setActiveListId(id);
      setSelectedIds([]);
    },
    selectedIds,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    setSelectedIds,
    toggleSelected,
    updateSource,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromCurrentList,
    removeFromList,
    deleteSelected,
    deleteSources,
  };
}
