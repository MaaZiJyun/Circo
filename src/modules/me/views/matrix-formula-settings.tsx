"use client";

import { useState } from "react";
import type { MatrixFormulaSettings as MatrixFormulaConfig } from "@/shared/model/app-state";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import { SectionHeader } from "@/shared/components/page-elements";
import { Button, Card, Field, Input } from "@/shared/components/ui";
import {
  defaultMatrixFormulas,
  resolveMatrixFormulas,
} from "../model/matrix-formula";
import { validateTaskCoordinateFormulas } from "../model/task-coordinate-formula";

export function MatrixFormulaSettings() {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const [draft, setDraft] = useState<MatrixFormulaConfig>(() =>
    resolveMatrixFormulas(state?.profile.matrixFormulas),
  );
  const [error, setError] = useState("");
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
