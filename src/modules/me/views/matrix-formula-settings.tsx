"use client";

import { useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import type { MatrixFormulaSettings as MatrixFormulaConfig } from "@/shared/model/app-state";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import { SectionHeader } from "@/shared/components/page-elements";
import { Alert, Button, Card, Field, Input } from "@/shared/components/ui";
import {
  defaultMatrixFormulas,
  resolveMatrixFormulas,
} from "../model/matrix-formula";
import {
  taskFormulaVariables,
  validateTaskCoordinateFormulas,
} from "../model/task-coordinate-formula";

const taskVariableHelp = taskFormulaVariables.map((name) => ({
  name,
  label: `settings.taskVariable.${name}` as const,
}));

export function MatrixFormulaSettings() {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const [draft, setDraft] = useState<MatrixFormulaConfig>(() =>
    resolveMatrixFormulas(state?.profile.matrixFormulas),
  );
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  if (!state) return null;
  const persist = (formulas: MatrixFormulaConfig) =>
    mutate((current) => ({
      ...current,
      profile: {
        ...current.profile,
        matrixFormulas: {
          urgency: formulas.urgency,
          importance: formulas.importance,
        },
      },
    }));
  const save = () => {
    try {
      validateTaskCoordinateFormulas(draft);
      persist(draft);
      setError("");
    } catch (cause) {
      setError(
        `${t("settings.matrixFormulaInvalid")} ${cause instanceof Error ? cause.message : ""}`,
      );
    }
  };
  const reset = () => {
    setDraft(defaultMatrixFormulas);
    persist(defaultMatrixFormulas);
    setError("");
  };
  const update = (
    key: "urgency" | "importance",
    value: string,
  ) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <Card>
      <SectionHeader title={t("settings.matrixFormulas")} />
      <Alert>{t("settings.matrixFormulaHint")}</Alert>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FormulaField
          label={t("settings.urgencyFormula")}
          value={draft.urgency ?? defaultMatrixFormulas.urgency!}
          onChange={(value) => update("urgency", value)}
        />
        <FormulaField
          label={t("settings.importanceFormula")}
          value={draft.importance ?? defaultMatrixFormulas.importance!}
          onChange={(value) => update("importance", value)}
        />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs leading-5 text-zinc-500">
        <span>
          {t("settings.taskFormulaVariables")}: {taskFormulaVariables.join(", ")}
        </span>
        <button
          type="button"
          className="grid size-7 shrink-0 place-items-center rounded-full text-amber-600 transition hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40"
          aria-label={t("settings.matrixVariableHelp")}
          title={t("settings.matrixVariableHelp")}
          aria-expanded={showHelp}
          onClick={() => setShowHelp((current) => !current)}
        >
          <ExclamationCircleIcon className="size-5" />
        </button>
      </div>
      {showHelp && (
        <dl className="mt-3 grid gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20 sm:grid-cols-2">
          {taskVariableHelp.map((item) => (
            <div key={item.name}>
              <dt className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {item.name}
              </dt>
              <dd className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {t(item.label)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button onClick={save}>{t("common.save")}</Button>
        <Button variant="secondary" onClick={reset}>
          {t("settings.restoreMatrixDefaults")}
        </Button>
      </div>
    </Card>
  );
}

function FormulaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Input
        className="font-mono text-xs"
        value={value}
        maxLength={300}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
