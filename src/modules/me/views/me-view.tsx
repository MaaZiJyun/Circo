"use client";

import { useDailyTaskCache } from "../view-models/use-daily-task-cache";
import { DailyTaskHistory } from "./daily-task-history";
import { DatabaseInfoPanel } from "./database-info-panel";

export function MeView() {
  const vm = useDailyTaskCache();
  if (!vm) return null;
  return (
    <div className="space-y-8">
      <DailyTaskHistory />
      <DatabaseInfoPanel />
    </div>
  );
}
