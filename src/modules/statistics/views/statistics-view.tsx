"use client";

import { EmptyState } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

export function StatisticsView() {
  const { t } = useI18n();
  return (
    <div className="grid h-full min-h-80 place-items-center">
      <EmptyState
        title={t("statistics.emptyTitle")}
        description={t("statistics.emptyDescription")}
      />
    </div>
  );
}
