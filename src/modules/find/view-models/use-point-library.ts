"use client";

import { useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type { PointList, ReferencePoint } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";
import { isRecentlyAdded } from "./use-library-management";

export const DEFAULT_POINT_LIST_ID = "point_list_default";
export const RECENT_POINT_LIST_ID = "point_list_recent";
export type PointListInput = Pick<PointList, "name" | "note" | "color">;

export function usePointLibrary() {
  const { state, mutate } = useStore();
  const [activeListId, setActiveListId] = useState(DEFAULT_POINT_LIST_ID);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const points = useMemo(
    () => (state ? activeItems(state.points) : []),
    [state],
  );
  const lists = useMemo(
    () => (state ? activeItems(state.pointLists ?? []) : []),
    [state],
  );
  const recentPoints = useMemo(
    () => points.filter((point) => isRecentlyAdded(point.createdAt)),
    [points],
  );
  const filteredPoints = useMemo(
    () =>
      activeListId === DEFAULT_POINT_LIST_ID
        ? points
        : activeListId === RECENT_POINT_LIST_ID
          ? recentPoints
          : points.filter((point) => point.listIds.includes(activeListId)),
    [activeListId, points, recentPoints],
  );
  const createPoint = (
    point: Omit<ReferencePoint, "id" | "createdAt" | "updatedAt">,
  ) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      points: [
        ...current.points,
        {
          ...point,
          listIds: point.listIds ?? [],
          id: createId("point"),
          createdAt: stamp,
          updatedAt: stamp,
        },
      ],
    }));
  };
  const updatePoint = (id: string, change: Partial<ReferencePoint>) =>
    mutate((current) => ({
      ...current,
      points: current.points.map((item) =>
        item.id === id ? { ...item, ...change, updatedAt: now() } : item,
      ),
    }));
  const deletePoint = (id: string) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      points: current.points.map((item) =>
        item.id === id ? { ...item, deletedAt: stamp, updatedAt: stamp } : item,
      ),
    }));
  };
  const createList = (input: PointListInput) => {
    const stamp = now();
    const list: PointList = {
      id: createId("point_list"),
      ...input,
      system: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      pointLists: [...(current.pointLists ?? []), list],
    }));
    setActiveListId(list.id);
  };
  const updateList = (id: string, change: PointListInput) =>
    mutate((current) => ({
      ...current,
      pointLists: (current.pointLists ?? []).map((item) =>
        item.id === id && !item.system
          ? { ...item, ...change, updatedAt: now() }
          : item,
      ),
    }));
  const deleteList = (id: string) => {
    if (lists.find((item) => item.id === id)?.system !== null) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      pointLists: (current.pointLists ?? []).map((item) =>
        item.id === id ? { ...item, deletedAt: stamp, updatedAt: stamp } : item,
      ),
      points: current.points.map((item) => ({
        ...item,
        listIds: item.listIds.filter((listId) => listId !== id),
      })),
    }));
    setActiveListId(DEFAULT_POINT_LIST_ID);
  };
  const addToList = (ids: string[], listId: string) => {
    if (lists.find((item) => item.id === listId)?.system !== null) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      points: current.points.map((item) =>
        ids.includes(item.id) && !item.listIds.includes(listId)
          ? { ...item, listIds: [...item.listIds, listId], updatedAt: stamp }
          : item,
      ),
    }));
  };
  const removeFromCurrentList = (id: string) => {
    if (lists.find((item) => item.id === activeListId)?.system !== null) return;
    mutate((current) => ({
      ...current,
      points: current.points.map((item) =>
        item.id === id
          ? {
              ...item,
              listIds: item.listIds.filter((listId) => listId !== activeListId),
              updatedAt: now(),
            }
          : item,
      ),
    }));
  };
  return {
    points,
    lists,
    recentPoints,
    filteredPoints,
    activeListId,
    setActiveListId,
    draggedIds,
    setDraggedIds,
    createPoint,
    updatePoint,
    deletePoint,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromCurrentList,
  };
}
