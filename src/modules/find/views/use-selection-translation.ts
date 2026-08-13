"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TranslationState } from "./translation-dialog";

export function useSelectionTranslation() {
  const { locale, t } = useI18n();
  const [translation, setTranslation] = useState<TranslationState | null>(null);
  const request = useRef(0);
  const translateSelection = async (
    source: string,
    target: "zh-CN" | "en" = locale,
  ) => {
    const requestId = ++request.current;
    setTranslation({ source, result: "", error: "", loading: true, target });
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, target }),
      });
      const payload = (await response.json()) as {
        translation?: string;
        error?: string;
      };
      if (!response.ok || !payload.translation)
        throw new Error(payload.error || t("find.translationFailed"));
      if (requestId !== request.current) return;
      setTranslation({
        source,
        result: payload.translation,
        error: "",
        loading: false,
        target,
      });
    } catch (cause) {
      if (requestId !== request.current) return;
      setTranslation({
        source,
        result: "",
        error:
          cause instanceof Error ? cause.message : t("find.translationFailed"),
        loading: false,
        target,
      });
    }
  };
  return {
    translation,
    translateSelection,
    closeTranslation: () => setTranslation(null),
  };
}
