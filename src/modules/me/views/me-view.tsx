"use client";

import { PageHeader } from "@/shared/components/page-elements";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useDailyTaskCache } from "../view-models/use-daily-task-cache";
import { DailyTaskHistory } from "./daily-task-history";
import { DatabaseInfoPanel } from "./database-info-panel";

export function MeView() {
  const vm = useDailyTaskCache();
  const { t } = useI18n();
  if (!vm) return null;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("me.eyebrow")}
        title={t("me.title")}
        subtitle={t("me.subtitle")}
      />
      <DailyTaskHistory />
      <DatabaseInfoPanel />
    </div>
  );
}
