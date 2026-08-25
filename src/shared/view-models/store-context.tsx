"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HttpAppRepository } from "@/shared/infrastructure/http-repository";
import type {
  AppEntity,
  AppState,
  CollectionName,
} from "@/shared/model/app-state";
import { isAppState } from "@/shared/model/app-state";
import { deadlineTime, taskStatusAt } from "@/shared/model/task-status";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface StoreValue {
  state: AppState | null;
  status: SaveStatus;
  error: string | null;
  reload: () => Promise<void>;
  mutate: (updater: (current: AppState) => AppState) => void;
  softDelete: (collection: CollectionName, id: string) => void;
  restoreItem: (collection: CollectionName, id: string) => void;
  purgeItem: (collection: CollectionName, id: string) => void;
  restoreBackup: (value: unknown) => Promise<boolean>;
  createArchive: () => Promise<Blob>;
  restoreArchive: (file: File) => Promise<boolean>;
}

const StoreContext = createContext<StoreValue | null>(null);
const repository = new HttpAppRepository();

function changeDeletion(
  state: AppState,
  collection: CollectionName,
  id: string,
  deletedAt?: string,
): AppState {
  const updatedAt = new Date().toISOString();
  const items = state[collection] as AppEntity[];
  const nextItems = items.map((item) =>
    item.id === id ? { ...item, deletedAt, updatedAt } : item,
  );
  return { ...state, [collection]: nextItems, updatedAt };
}

function synchronizeTaskStatuses(mutate: StoreValue["mutate"]) {
  const currentTime = Date.now();
  const stamp = new Date(currentTime).toISOString();
  mutate((current) => ({
    ...current,
    tasks: current.tasks.map((task) => {
      if (task.deletedAt) return task;
      const status = taskStatusAt(task, currentTime);
      return status === task.status
        ? task
        : { ...task, status, updatedAt: stamp };
    }),
  }));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const saveQueue = useRef(Promise.resolve());

  const reload = useCallback(async () => {
    setStatus("idle");
    setError(null);
    try {
      setState(await repository.load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load data.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void repository
      .load()
      .then((loaded) => {
        if (active) setState(loaded);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to load data.",
        );
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: AppState) => {
    setStatus("saving");
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        const saved = await repository.save(next);
        setState((current) =>
          current && current.updatedAt === next.updatedAt ? saved : current,
        );
        setStatus("saved");
        setError(null);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : "Unable to save data.",
        );
        setStatus("error");
      });
  }, []);

  const mutate = useCallback(
    (updater: (current: AppState) => AppState) => {
      setState((current) => {
        if (!current) return current;
        const next = {
          ...updater(current),
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const softDelete = useCallback(
    (collection: CollectionName, id: string) => {
      mutate((current) =>
        changeDeletion(current, collection, id, new Date().toISOString()),
      );
    },
    [mutate],
  );

  const restoreItem = useCallback(
    (collection: CollectionName, id: string) => {
      mutate((current) => changeDeletion(current, collection, id));
    },
    [mutate],
  );
  const purgeItem = useCallback(
    (collection: CollectionName, id: string) => {
      mutate((current) => ({
        ...current,
        [collection]: (current[collection] as AppEntity[]).filter(
          (item) => item.id !== id,
        ),
      }));
    },
    [mutate],
  );

  const restoreBackup = useCallback(async (value: unknown) => {
    if (!isAppState(value)) return false;
    const restored = await repository.restore(value);
    setState(restored);
    setStatus("saved");
    return true;
  }, []);

  const createArchive = useCallback(async () => {
    const response = await fetch("/api/backup", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to create backup.");
    return response.blob();
  }, []);

  const restoreArchive = useCallback(async (file: File) => {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/backup", { method: "POST", body: form });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: unknown;
      } | null;
      setError(
        typeof payload?.error === "string"
          ? payload.error
          : "Unable to restore backup.",
      );
      setStatus("error");
      return false;
    }
    const restored: unknown = await response.json();
    if (!isAppState(restored)) return false;
    setState(restored);
    setError(null);
    setStatus("saved");
    return true;
  }, []);

  useEffect(() => {
    if (!state) return;
    const currentTime = Date.now();
    const changed = state.tasks.some(
      (task) =>
        !task.deletedAt && task.status !== taskStatusAt(task, currentTime),
    );
    if (changed) {
      const timer = window.setTimeout(() => synchronizeTaskStatuses(mutate), 0);
      return () => window.clearTimeout(timer);
    }
    const nextDeadline = state.tasks.reduce<number | undefined>((next, task) => {
      if (task.deletedAt || task.status === "done") return next;
      const deadline = deadlineTime(task.dueDate);
      if (!Number.isFinite(deadline) || deadline <= currentTime) return next;
      return next === undefined || deadline < next ? deadline : next;
    }, undefined);
    if (nextDeadline === undefined) return;
    const timer = window.setTimeout(
      () => synchronizeTaskStatuses(mutate),
      Math.min(nextDeadline - currentTime + 50, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [mutate, state]);

  const value = useMemo(
    () => ({
      state,
      status,
      error,
      reload,
      mutate,
      softDelete,
      restoreItem,
      purgeItem,
      restoreBackup,
      createArchive,
      restoreArchive,
    }),
    [
      state,
      status,
      error,
      reload,
      mutate,
      softDelete,
      restoreItem,
      purgeItem,
      restoreBackup,
      createArchive,
      restoreArchive,
    ],
  );
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider.");
  return value;
}
