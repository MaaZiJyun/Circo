import path from "node:path";

import type { TranslationPipeline } from "@huggingface/transformers";

const MODEL_BY_TARGET = {
  "zh-CN": "Xenova/opus-mt-en-zh",
  en: "Xenova/opus-mt-zh-en",
} as const;

type TranslationTarget = keyof typeof MODEL_BY_TARGET;

const pipelines = new Map<TranslationTarget, Promise<TranslationPipeline>>();

async function loadPipeline(target: TranslationTarget) {
  const existing = pipelines.get(target);
  if (existing) return existing;

  const loading = (async () => {
    const { env, pipeline } = await import("@huggingface/transformers");
    env.cacheDir = process.env.CIRCO_MODELS_DIR?.trim()
      ? path.resolve(process.env.CIRCO_MODELS_DIR)
      : path.join(process.cwd(), "data", "models");
    env.allowRemoteModels = process.env.NODE_ENV !== "production";

    return pipeline("translation", MODEL_BY_TARGET[target], {
      dtype: "q8",
    });
  })();

  pipelines.set(target, loading);
  loading.catch(() => pipelines.delete(target));
  return loading;
}

export async function translateLocally(text: string, target: TranslationTarget) {
  const translator = await loadPipeline(target);
  const result = await translator(text);
  const first = Array.isArray(result) ? result[0] : result;
  if (!first || !("translation_text" in first)) {
    throw new Error("Local translation model returned no text.");
  }
  return first.translation_text;
}
