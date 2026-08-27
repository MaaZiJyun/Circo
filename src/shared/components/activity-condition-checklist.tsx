"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { ActivityConditionDraft } from "@/shared/model/activity-conditions";
import { useI18n } from "@/shared/i18n/i18n-context";
import { Button, Checkbox, IconButton, Input } from "./ui";

export function ActivityConditionChecklist({
  conditions,
  editable,
  allowToggle = false,
  onChange,
  onToggle,
  onAdd,
  onDelete,
}: {
  conditions: ActivityConditionDraft[];
  editable: boolean;
  allowToggle?: boolean;
  onChange: (id: string, condition: string) => void;
  onToggle: (id: string, satisfied: boolean) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("hand.activityConditions")}</h3>
        {editable && (
          <Button type="button" variant="secondary" onClick={onAdd}>
            <PlusIcon className="size-4" />
            {t("hand.addCondition")}
          </Button>
        )}
      </div>
      <div className="grid gap-2">
        {conditions.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2 dark:border-zinc-900"
          >
            <Checkbox
              checked={Boolean(item.satisfiedAt)}
              disabled={!allowToggle}
              aria-label={item.condition || t("hand.activityCondition")}
              onChange={(checked) => onToggle(item.id, checked)}
            />
            {editable ? (
              <Input
                className="min-w-0 flex-1"
                value={item.condition}
                placeholder={t("hand.conditionPlaceholder")}
                onChange={(event) => onChange(item.id, event.target.value)}
              />
            ) : (
              <span
                className={`min-w-0 flex-1 text-sm ${item.satisfiedAt ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300"}`}
              >
                {item.condition || t("hand.conditionPlaceholder")}
              </span>
            )}
            {editable && (
              <IconButton
                type="button"
                size="sm"
                tone="danger"
                label={t("common.delete")}
                onClick={() => onDelete(item.id)}
              >
                <TrashIcon className="size-4" />
              </IconButton>
            )}
          </div>
        ))}
        {!conditions.length && (
          <p className="text-sm text-zinc-500">{t("hand.noActivityConditions")}</p>
        )}
      </div>
    </section>
  );
}
