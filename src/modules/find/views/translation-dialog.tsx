"use client";

import { useState } from "react";
import { Button, Dialog } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

export interface TranslationState {
  source: string;
  result: string;
  error: string;
  loading: boolean;
  target: "zh-CN" | "en";
}

export function TranslationDialog({
  value,
  onClose,
  onTargetChange,
}: {
  value: TranslationState;
  onClose: () => void;
  onTargetChange: (target: TranslationState["target"]) => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<"source" | "result" | null>(null);
  const copy = async (kind: "source" | "result", text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1_500);
  };
  return (
    <Dialog
      open
      title={t("find.translationResult")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <div className="flex gap-2" aria-label={t("find.targetLanguage")}>
          {(["en", "zh-CN"] as const).map((target) => (
            <Button
              key={target}
              variant={value.target === target ? "primary" : "secondary"}
              disabled={value.loading && value.target === target}
              onClick={() => onTargetChange(target)}
            >
              {t(
                target === "en"
                  ? "find.languageEnglish"
                  : "find.languageChinese",
              )}
            </Button>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-zinc-500">
              {t("find.originalText")}
            </p>
            <Button
              variant="ghost"
              className="min-h-8 px-2 text-xs"
              onClick={() => void copy("source", value.source)}
            >
              {copied === "source" ? t("find.copied") : t("find.copyOriginal")}
            </Button>
          </div>
          <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6">
            {value.source}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-zinc-500">
            {t("find.translatedText")}
          </p>
          <Button
            variant="ghost"
            className="min-h-8 px-2 text-xs"
            disabled={!value.result}
            onClick={() => void copy("result", value.result)}
          >
            {copied === "result" ? t("find.copied") : t("find.copyTranslation")}
          </Button>
        </div>
        <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
          {value.loading ? (
            <p className="text-sm text-zinc-500">{t("find.translating")}</p>
          ) : value.error ? (
            <p className="text-sm text-red-600">{value.error}</p>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6">
              {value.result}
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
