"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Field, IconButton, Input } from "./ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { FocusRecord } from "@/shared/model/entities";
import { createId, formatLocalDateTime, parseLocalDateTime } from "@/shared/model/factories";

const hasTimeZone = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/.test(value);

function focusTime(value: string) {
  return hasTimeZone(value) ? Date.parse(value) : parseLocalDateTime(value);
}

function inputDateTime(value: string) {
  const parsed = focusTime(value);
  return Number.isFinite(parsed) ? formatLocalDateTime(parsed) : value.slice(0, 16);
}

export function validActivityFocus(records: FocusRecord[]) {
  return records.every((record) => {
    const startedAt = focusTime(record.startedAt);
    const endedAt = focusTime(record.endedAt);
    return Number.isFinite(startedAt) && Number.isFinite(endedAt) && endedAt >= startedAt && record.duration > 0;
  });
}

export function ActivityFocusEditor({
  records,
  editable,
  activityId,
  activityTitle,
  expectedOutput,
  defaultStartedAt,
  onChange,
}: {
  records: FocusRecord[];
  editable: boolean;
  activityId: string;
  activityTitle: string;
  expectedOutput: string;
  defaultStartedAt: string;
  onChange: (records: FocusRecord[]) => void;
}) {
  const { t } = useI18n();
  const update = (id: string, change: Partial<FocusRecord>) =>
    onChange(records.map((record) => (record.id === id ? { ...record, ...change } : record)));
  const add = () => {
    const stamp = new Date().toISOString();
    const startedAt = inputDateTime(defaultStartedAt || stamp);
    const start = focusTime(startedAt);
    onChange([
      ...records,
      {
        id: createId("focus"),
        startedAt,
        endedAt: formatLocalDateTime(start + 60 * 60_000),
        duration: 60,
        focusOn: activityId,
        title: activityTitle,
        output: expectedOutput,
        note: "",
        createdAt: stamp,
        updatedAt: stamp,
      },
    ]);
  };
  const updateStart = (record: FocusRecord, startedAt: string) => {
    const start = focusTime(startedAt);
    update(record.id, {
      startedAt,
      ...(Number.isFinite(start) ? { endedAt: formatLocalDateTime(start + record.duration * 60_000) } : {}),
    });
  };
  const updateEnd = (record: FocusRecord, endedAt: string) => {
    const start = focusTime(record.startedAt);
    const end = focusTime(endedAt);
    update(record.id, {
      endedAt,
      ...(Number.isFinite(start) && Number.isFinite(end) ? { duration: Math.max(0, (end - start) / 60_000) } : {}),
    });
  };
  const updateDuration = (record: FocusRecord, duration: number) => {
    const minutes = Math.max(0, duration || 0);
    const start = focusTime(record.startedAt);
    update(record.id, {
      duration: minutes,
      ...(Number.isFinite(start) ? { endedAt: formatLocalDateTime(start + minutes * 60_000) } : {}),
    });
  };
  return (
    <section className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("hand.focusRecords")}</h3>
        {editable && (
          <Button type="button" variant="secondary" onClick={add}>
            <PlusIcon className="size-4" />
            {t("hand.addFocus")}
          </Button>
        )}
      </div>
      {records.map((record, index) => (
        <div key={record.id} className="grid gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-500">
              {t("hand.focusRecord").replace("{index}", String(index + 1))}
            </span>
            {editable && (
              <IconButton
                type="button"
                size="sm"
                tone="danger"
                label={t("hand.removeFocus")}
                onClick={() => onChange(records.filter((item) => item.id !== record.id))}
              >
                <TrashIcon className="size-4" />
              </IconButton>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("dashboard.focusStart")}>
              <Input
                type="datetime-local"
                disabled={!editable}
                value={inputDateTime(record.startedAt)}
                onChange={(event) => updateStart(record, event.target.value)}
              />
            </Field>
            <Field label={t("dashboard.focusEnd")}>
              <Input
                type="datetime-local"
                disabled={!editable}
                value={inputDateTime(record.endedAt)}
                onChange={(event) => updateEnd(record, event.target.value)}
              />
            </Field>
          </div>
          <Field label={t("dashboard.focusDuration")}>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              disabled={!editable}
              value={record.duration}
              onChange={(event) => updateDuration(record, Number(event.target.value))}
            />
          </Field>
        </div>
      ))}
      {!records.length && <p className="text-sm text-zinc-500">{t("hand.noFocusRecords")}</p>}
      {!validActivityFocus(records) && <p className="text-sm text-red-600">{t("hand.invalidFocus")}</p>}
    </section>
  );
}
