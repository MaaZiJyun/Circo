import fs from "node:fs";
import path from "node:path";
import { getStorageConfig } from "./storage-config";

export interface ExternalModuleStatus {
  configured: boolean;
  directory: string;
  translation: { available: boolean; message: string };
  mineru: { available: boolean; message: string };
}

export function getExternalModulesDirectory() {
  return getStorageConfig().modulesDirectory.trim();
}

export function getTranslationModelsDirectory() {
  const root = getExternalModulesDirectory();
  return root
    ? path.join(/* turbopackIgnore: true */ root, "translation", "models")
    : "";
}

export function getMineruPaths() {
  const root = getExternalModulesDirectory();
  const directory = root
    ? path.join(/* turbopackIgnore: true */ root, "mineru")
    : "";
  return {
    command: directory
      ? path.join(/* turbopackIgnore: true */ directory, "mineru")
      : "",
    models: directory
      ? path.join(
          /* turbopackIgnore: true */ directory,
          "models",
          "pipeline",
        )
      : "",
  };
}

function translationAvailable(directory: string) {
  return [
    "Xenova/opus-mt-en-zh",
    "Xenova/opus-mt-zh-en",
  ].every((model) =>
    fs.existsSync(path.join(/* turbopackIgnore: true */ directory, model)),
  );
}

export function getExternalModuleStatus(): ExternalModuleStatus {
  const directory = getExternalModulesDirectory();
  if (!directory)
    return {
      configured: false,
      directory: "",
      translation: { available: false, message: "Modules directory is not configured." },
      mineru: { available: false, message: "Modules directory is not configured." },
    };
  const translationDirectory = getTranslationModelsDirectory();
  const mineru = getMineruPaths();
  const hasTranslation = translationAvailable(translationDirectory);
  const hasMineru =
    fs.existsSync(mineru.command) &&
    fs.statSync(mineru.command).isFile() &&
    fs.existsSync(
      path.join(/* turbopackIgnore: true */ mineru.models, "models"),
    );
  return {
    configured: true,
    directory,
    translation: {
      available: hasTranslation,
      message: hasTranslation
        ? "English–Chinese translation models are ready."
        : "Expected translation/models/Xenova/opus-mt-en-zh and opus-mt-zh-en.",
    },
    mineru: {
      available: hasMineru,
      message: hasMineru
        ? "MinerU runtime and pipeline models are ready."
        : "Expected mineru/mineru, mineru/runtime, and mineru/models/pipeline.",
    },
  };
}
