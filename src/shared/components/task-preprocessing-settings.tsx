"use client";

import { useState } from "react";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { createId } from "@/shared/model/factories";
import {
  defaultTaskPreprocessingRules,
  type TaskPreprocessingRule,
} from "@/shared/model/task-preprocessor";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import { SectionHeader } from "./page-elements";
import { Alert, Button, Card, Dialog, Field, Input, Textarea } from "./ui";

const scoreFields = [
  ["impact", "me.impact"],
  ["goal", "me.goal"],
  ["risk", "me.risk"],
  ["value", "me.value"],
  ["delayLoss", "settings.taskPreprocessingDelayLoss"],
  ["complexity", "me.complexity"],
  ["uncertainty", "me.uncertainty"],
] as const;

function copyRule(rule: TaskPreprocessingRule) {
  return { ...rule, keywords: [...rule.keywords] };
}

function copyRules(rules: TaskPreprocessingRule[]) {
  return rules.map(copyRule);
}

function newRule(name: string): TaskPreprocessingRule {
  return {
    id: createId("task-rule"),
    name,
    keywords: [],
    description: "明确“{{name}}”的完成标准。",
    estimatedMinutes: 60,
    expectedOutput: "一个明确、可检查的完成结果。",
    impact: 3,
    goal: 3,
    risk: 3,
    value: 3,
    delayLoss: 3,
    complexity: 3,
    uncertainty: 3,
  };
}

function normalizeScore(value: number) {
  return Math.max(1, Math.min(5, Math.round(Number(value) || 3)));
}

function normalizeRule(rule: TaskPreprocessingRule): TaskPreprocessingRule {
  return {
    ...rule,
    name: rule.name.trim() || "未命名分类",
    keywords: rule.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    estimatedMinutes: Math.max(
      5,
      Math.min(10_080, Math.round(Number(rule.estimatedMinutes) || 5)),
    ),
    impact: normalizeScore(rule.impact),
    goal: normalizeScore(rule.goal),
    risk: normalizeScore(rule.risk),
    value: normalizeScore(rule.value),
    delayLoss: normalizeScore(rule.delayLoss),
    complexity: normalizeScore(rule.complexity),
    uncertainty: normalizeScore(rule.uncertainty),
  };
}

export function TaskPreprocessingSettings() {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const [rules, setRules] = useState<TaskPreprocessingRule[]>(() =>
    copyRules(
      state?.profile.taskPreprocessingRules ?? defaultTaskPreprocessingRules,
    ),
  );
  const [editing, setEditing] = useState<TaskPreprocessingRule | null>(null);
  const [saved, setSaved] = useState(false);
  if (!state) return null;

  const persist = (nextRules: TaskPreprocessingRule[]) => {
    setRules(copyRules(nextRules));
    mutate((current) => ({
      ...current,
      profile: {
        ...current.profile,
        taskPreprocessingRules: nextRules,
      },
    }));
    setSaved(true);
  };
  const saveRule = () => {
    if (!editing) return;
    const normalized = normalizeRule(editing);
    const exists = rules.some((rule) => rule.id === normalized.id);
    persist(
      exists
        ? rules.map((rule) => (rule.id === normalized.id ? normalized : rule))
        : [...rules, normalized],
    );
    setEditing(null);
  };
  const deleteRule = (rule: TaskPreprocessingRule) => {
    if (
      rule.id === "generic" ||
      !window.confirm(`${t("common.confirmDelete")}\n\n${rule.name}`)
    ) {
      return;
    }
    persist(rules.filter((item) => item.id !== rule.id));
  };
  const reset = () => persist(copyRules(defaultTaskPreprocessingRules));

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionHeader title={t("settings.taskPreprocessing")} />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("settings.taskPreprocessingHint")}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            setEditing(newRule(t("settings.taskPreprocessingNewName")))
          }
        >
          <PlusIcon className="size-4" />
          {t("settings.taskPreprocessingAdd")}
        </Button>
      </div>

      <div className="mt-5 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center gap-4 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="font-medium">{rule.name}</h3>
                <span className="text-xs text-zinc-500">
                  {rule.estimatedMinutes} min
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
                {rule.keywords.length
                  ? rule.keywords.join(" · ")
                  : t("settings.taskPreprocessingGenericLocked")}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                aria-label={`${t("common.edit")} ${rule.name}`}
                onClick={() => setEditing(copyRule(rule))}
              >
                <PencilSquareIcon className="size-4" />
                <span className="hidden sm:inline">{t("common.edit")}</span>
              </Button>
              <Button
                variant="ghost"
                disabled={rule.id === "generic"}
                aria-label={`${t("settings.taskPreprocessingDelete")} ${rule.name}`}
                onClick={() => deleteRule(rule)}
              >
                <TrashIcon className="size-4" />
                <span className="hidden sm:inline">
                  {t("settings.taskPreprocessingDelete")}
                </span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {saved && (
        <div className="mt-4">
          <Alert tone="success">{t("settings.taskPreprocessingSaved")}</Alert>
        </div>
      )}
      <div className="mt-4">
        <Button variant="ghost" onClick={reset}>
          {t("settings.taskPreprocessingReset")}
        </Button>
      </div>

      {editing && (
        <Dialog
          open
          size="lg"
          title={editing.name || t("settings.taskPreprocessingName")}
          closeLabel={t("common.close")}
          onClose={() => setEditing(null)}
        >
          <div className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={t("settings.taskPreprocessingName")}>
                <Input
                  autoFocus
                  value={editing.name}
                  maxLength={100}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                />
              </Field>
              <Field
                label={t("settings.taskPreprocessingKeywords")}
                hint={t("settings.taskPreprocessingKeywordsHint")}
              >
                <Input
                  value={editing.keywords.join(", ")}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      keywords: event.target.value
                        .split(",")
                        .map((keyword) => keyword.trim()),
                    })
                  }
                />
              </Field>
              <Field label={t("settings.taskPreprocessingDescription")}>
                <Textarea
                  value={editing.description}
                  maxLength={1000}
                  onChange={(event) =>
                    setEditing({ ...editing, description: event.target.value })
                  }
                />
              </Field>
              <Field label={t("settings.taskPreprocessingOutput")}>
                <Textarea
                  value={editing.expectedOutput}
                  maxLength={1000}
                  onChange={(event) =>
                    setEditing({ ...editing, expectedOutput: event.target.value })
                  }
                />
              </Field>
            </div>
            <Field label={t("settings.taskPreprocessingDuration")}>
              <Input
                type="number"
                min="5"
                max="10080"
                step="5"
                value={editing.estimatedMinutes}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    estimatedMinutes: Number(event.target.value),
                  })
                }
              />
            </Field>
            <p className="text-sm font-medium">
              {t("settings.taskPreprocessingScore")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {scoreFields.map(([key, label]) => (
                <Field key={key} label={t(label)}>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    value={editing[key]}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        [key]: Number(event.target.value),
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            {editing.id === "generic" && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("settings.taskPreprocessingGenericLocked")}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={saveRule}>{t("common.save")}</Button>
            </div>
          </div>
        </Dialog>
      )}
    </Card>
  );
}
