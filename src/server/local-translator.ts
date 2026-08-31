import path from "node:path";

import type { TranslationPipeline } from "@huggingface/transformers";
import { getTranslationModelsDirectory } from "@/shared/infrastructure/external-modules";

const MODEL_BY_TARGET = {
  "zh-CN": "Xenova/opus-mt-en-zh",
  en: "Xenova/opus-mt-zh-en",
} as const;

type TranslationTarget = keyof typeof MODEL_BY_TARGET;

const pipelines = new Map<string, Promise<TranslationPipeline>>();

async function loadPipeline(target: TranslationTarget) {
  const modelsDirectory = getTranslationModelsDirectory();
  if (!modelsDirectory)
    throw new Error(
      "Translation module is not configured. Choose a Circo modules directory in Settings.",
    );
  const key = `${modelsDirectory}:${target}`;
  const existing = pipelines.get(key);
  if (existing) return existing;

  const loading = (async () => {
    const { env, pipeline } = await import("@huggingface/transformers");
    env.cacheDir = path.resolve(modelsDirectory);
    env.allowRemoteModels = false;

    return pipeline("translation", MODEL_BY_TARGET[target], {
      dtype: "q8",
    });
  })();

  pipelines.set(key, loading);
  loading.catch(() => pipelines.delete(key));
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
