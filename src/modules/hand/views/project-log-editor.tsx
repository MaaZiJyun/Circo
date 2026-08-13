"use client";

import { useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MarkdownPreview } from "@/modules/find/views/markdown-preview";
import { Button, Field, Select, Textarea } from "@/shared/components/ui";
import { typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { LogInput } from "../view-models/use-hand-view-model";

export function ProjectLogEditor({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: LogInput;
  onClose: () => void;
  onSave: (input: LogInput) => Promise<void>;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<LogInput>(
    initial ?? {
      type: "progress",
      period: "day",
      content: "# ",
      nextStep: "",
      tags: [],
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  if (!open) return null;
  const submit = async () => {
    if (!input.content.replace(/^#+\s*/gm, "").trim()) return;
    setSaving(true);
    setError(false);
    try {
      await onSave(input);
      onClose();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("hand.markdownEditor")}
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold">{t("hand.markdownEditor")}</h2>
            <p className="text-xs text-zinc-500">{t("hand.markdownHint")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={saving} onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button disabled={saving} onClick={() => void submit()}>
              <CheckIcon className="size-4" />
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </header>
        {error && (
          <p className="px-5 pt-3 text-sm text-red-600">
            {t("hand.logSaveFailed")}
          </p>
        )}
        <div className="grid min-h-0 flex-1 md:grid-cols-2">
          <section className="min-h-[520px] min-w-0 overflow-y-auto border-b border-zinc-200 md:border-b-0 md:border-r dark:border-zinc-800">
            <h3 className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              {t("hand.markdownPreview")}
            </h3>
            <div className="p-6">
              <MarkdownPreview content={input.content} />
            </div>
          </section>
          <section className="flex min-h-[520px] min-w-0 flex-col">
            <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
              <Field label={t("hand.logPeriod")}>
                <Select
                  value={input.period}
                  onChange={(event) =>
                    setInput({
                      ...input,
                      period: event.target.value as LogInput["period"],
                    })
                  }
                >
                  {(["day", "week", "month", "year"] as const).map(
                    (period) => (
                      <option key={period} value={period}>
                        {t(`hand.logPeriod.${period}`)}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
              <Field label={t("hand.logType")}>
                <Select
                  value={input.type}
                  onChange={(event) =>
                    setInput({
                      ...input,
                      type: event.target.value as LogInput["type"],
                    })
                  }
                >
                  {(
                    ["progress", "decision", "problem", "conclusion"] as const
                  ).map((type) => (
                    <option key={type} value={type}>
                      {t(typeLabels[type])}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <h3 className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              {t("hand.markdownSource")}
            </h3>
            <Textarea
              autoFocus
              spellCheck
              value={input.content}
              onChange={(event) =>
                setInput({ ...input, content: event.target.value })
              }
              className="min-h-0 flex-1 resize-none rounded-none border-0 font-mono leading-7"
            />
          </section>
        </div>
      </section>
    </div>
  );
}
