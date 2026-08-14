"use client";

import { useEffect, useMemo, useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import type {
  FutureMessage,
  MessageReferenceKind,
} from "@/shared/model/message";
import { createId, now, today } from "@/shared/model/factories";
import { isDailySummary } from "@/shared/model/message-kind";
import { useStore } from "@/shared/view-models/store-context";

export type MessageInput = Pick<
  FutureMessage,
  | "subject"
  | "body"
  | "deliveryMode"
  | "deliverAt"
  | "references"
  | "attachments"
>;
export function useMessages() {
  const { state, mutate, restoreItem } = useStore();
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const update = () => setCurrentTime(Date.now());
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);
  const referenceOptions = useMemo(() => {
    if (!state) return [];
    const rows: { kind: MessageReferenceKind; id: string; label: string }[] =
      [];
    activeItems(state.sources).forEach((item) =>
      rows.push({ kind: "source", id: item.id, label: item.title }),
    );
    activeItems(state.points).forEach((item) =>
      rows.push({
        kind: "point",
        id: item.id,
        label: item.content.slice(0, 60),
      }),
    );
    activeItems(state.ideas).forEach((item) =>
      rows.push({ kind: "idea", id: item.id, label: item.title }),
    );
    activeItems(state.projects).forEach((item) =>
      rows.push({ kind: "project", id: item.id, label: item.name }),
    );
    activeItems(state.tasks).forEach((item) =>
      rows.push({ kind: "task", id: item.id, label: item.title }),
    );
    return rows;
  }, [state]);
  if (!state) return null;
  const messages = activeItems(state.messages ?? [])
    .slice()
    .sort((a, b) => b.deliverAt.localeCompare(a.deliverAt));
  const bin = (state.messages ?? [])
    .filter((item) => item.deletedAt)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const delivered = messages.filter(
    (item) => new Date(item.deliverAt).getTime() <= currentTime,
  );
  const scheduled = messages.filter(
    (item) => new Date(item.deliverAt).getTime() > currentTime,
  );
  const send = (input: MessageInput) => {
    const stamp = now();
    const message: FutureMessage = {
      id: createId("message"),
      recipient: "futureSelf",
      ...input,
      readAt: undefined,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      messages: [...(current.messages ?? []), message],
    }));
  };
  const markRead = (id: string) =>
    mutate((current) => ({
      ...current,
      messages: (current.messages ?? []).map((item) =>
        item.id === id
          ? { ...item, readAt: item.readAt ?? now(), updatedAt: now() }
          : item,
      ),
    }));
  const markUnread = (id: string) =>
    mutate((current) => ({
      ...current,
      messages: (current.messages ?? []).map((item) =>
        item.id === id
          ? {
              ...item,
              readAt: undefined,
              celebratedAt:
                item.celebratedAt ??
                (isDailySummary(item) ? item.readAt ?? now() : undefined),
              updatedAt: now(),
            }
          : item,
      ),
    }));
  const openMessage = (id: string, celebrate: boolean) => {
    const stamp = now();
    mutate((current) => ({
      ...current,
      messages: (current.messages ?? []).map((item) =>
        item.id === id
          ? {
              ...item,
              readAt: item.readAt ?? stamp,
              celebratedAt: celebrate ? stamp : item.celebratedAt,
              updatedAt: stamp,
            }
          : item,
      ),
    }));
  };
  const updateMany = (ids: string[], change: Partial<FutureMessage>) =>
    mutate((current) => ({
      ...current,
      messages: (current.messages ?? []).map((item) =>
        ids.includes(item.id) ? { ...item, ...change, updatedAt: now() } : item,
      ),
    }));
  const deleteMany = (ids: string[]) => updateMany(ids, { deletedAt: now() });
  const favoriteMany = (ids: string[], favorite: boolean) =>
    updateMany(ids, { favorite });
  const importDailyPlan = (message: FutureMessage) => {
    const plan = message.dailyPlan;
    if (!plan || plan.importedAt || plan.date !== today()) return;
    const stamp = now();
    mutate((current) => {
      const existingSourceIds = new Set(
        current.dailyTasks
          .filter((task) => task.date === plan.date && !task.deletedAt)
          .flatMap((task) => (task.sourceTaskId ? [task.sourceTaskId] : [])),
      );
      const existingIds = new Set(current.dailyTasks.map((task) => task.id));
      const additions = plan.items
        .filter(
          (item) =>
            !item.sourceTaskId || !existingSourceIds.has(item.sourceTaskId),
        )
        .map((item) => ({
          id: `daily_plan_${message.id}_${item.kind}_${item.id}`,
          date: plan.date,
          title: item.title,
          description: item.description,
          completed: false,
          dueAt: item.dueAt ?? `${plan.date}T23:59`,
          estimatedMinutes: item.estimatedMinutes,
          actualMinutes: 0,
          expectedOutput: item.expectedOutput,
          importance: item.importance,
          sourceTaskId: item.sourceTaskId,
          projectId: item.projectId,
          createdAt: stamp,
          updatedAt: stamp,
        }))
        .filter((task) => !existingIds.has(task.id));
      return {
        ...current,
        dailyTasks: [...current.dailyTasks, ...additions],
        messages: current.messages.map((item) =>
          item.id === message.id && item.dailyPlan
            ? {
                ...item,
                dailyPlan: { ...item.dailyPlan, importedAt: stamp },
                updatedAt: stamp,
              }
            : item,
        ),
      };
    });
  };
  return {
    profile: state.profile,
    messages,
    delivered,
    scheduled,
    bin,
    referenceOptions,
    send,
    markRead,
    markUnread,
    openMessage,
    deleteMany,
    favoriteMany,
    importDailyPlan,
    restoreMessage: (id: string) => restoreItem("messages", id),
  };
}
