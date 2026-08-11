"use client";

import { useState } from "react";
import { Badge, Button, Input, ProgressBar } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Goal } from "@/shared/model/entities";
import { progressPercent } from "@/shared/model/metrics";

export function GoalProgress({
  goal,
  update,
  remove,
}: {
  goal: Goal;
  update: (value: number) => void;
  remove: () => void;
}) {
  const { t, formatDate } = useI18n();
  const [current, setCurrent] = useState(goal.current);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{goal.title}</p>
          <p className="text-xs text-zinc-500">
            {current} / {goal.target} {goal.unit} · {formatDate(goal.dueDate)}
          </p>
        </div>
        <Badge tone={goal.status === "completed" ? "success" : "info"}>
          {t(statusLabels[goal.status])}
        </Badge>
      </div>
      <ProgressBar
        value={progressPercent(current, goal.target)}
        label={t("common.progress")}
      />
      <div className="mt-2 flex gap-2">
        <Input
          className="max-w-32"
          aria-label={t("me.current")}
          type="number"
          min="0"
          value={current}
          onChange={(event) => setCurrent(Number(event.target.value))}
        />
        <Button variant="ghost" onClick={() => update(current)}>
          {t("me.updateProgress")}
        </Button>
        <Button variant="danger" onClick={remove}>
          {t("common.delete")}
        </Button>
      </div>
    </div>
  );
}
