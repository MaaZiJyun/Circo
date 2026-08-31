"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import { isStorageConfig, type StorageConfig } from "@/shared/model/storage-config";
import { SectionHeader } from "./page-elements";
import { Alert, Button, Card, Field, Input } from "./ui";

interface ModuleState {
  translation: { available: boolean; message: string };
  mineru: { available: boolean; message: string };
}

function errorMessage(value: unknown) {
  return value && typeof value === "object" && "error" in value
    ? String(value.error)
    : "Unable to update modules directory.";
}

export function ExternalModuleSettings() {
  const { t } = useI18n();
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [status, setStatus] = useState<ModuleState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshStatus = async () => {
    const response = await fetch("/api/external-modules", { cache: "no-store" });
    if (response.ok) setStatus((await response.json()) as ModuleState);
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/storage-config", { cache: "no-store" }).then((response) =>
        response.json(),
      ),
      fetch("/api/external-modules", { cache: "no-store" }).then((response) =>
        response.json(),
      ),
    ]).then(([storage, modules]: unknown[]) => {
      if (!active) return;
      if (isStorageConfig(storage)) setConfig(storage);
      setStatus(modules as ModuleState);
    }).catch((cause: unknown) => active && setError(String(cause)));
    return () => { active = false; };
  }, []);

  const save = async (next: StorageConfig) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/storage-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const value: unknown = await response.json();
      if (!response.ok || !isStorageConfig(value))
        throw new Error(errorMessage(value));
      setConfig(value);
      await refreshStatus();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  const choose = async () => {
    if (!config) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/path-picker?kind=modules", {
        method: "POST",
      });
      if (response.status === 204) return;
      const value: unknown = await response.json();
      if (!response.ok || !value || typeof value !== "object" || !("path" in value))
        throw new Error(errorMessage(value));
      await save({ ...config, modulesDirectory: String(value.path) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setBusy(false);
    }
  };

  const moduleRow = (name: string, module?: ModuleState["mineru"]) => {
    const Icon = module?.available ? CheckCircleIcon : ExclamationCircleIcon;
    return (
      <div className="flex items-start gap-3 rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
        <Icon className={`mt-0.5 size-5 shrink-0 ${module?.available ? "text-emerald-600" : "text-amber-500"}`} />
        <div><p className="text-sm font-medium">{name}</p><p className="mt-1 text-xs text-zinc-500">{module?.message}</p></div>
      </div>
    );
  };

  return (
    <Card>
      <SectionHeader title={t("settings.externalModules")} />
      <Alert>{t("settings.externalModulesHint")}</Alert>
      {config ? <div className="mt-4 space-y-4">
        <Field label={t("settings.modulesDirectory")}>
          <div className="flex gap-2">
            <Input value={config.modulesDirectory} spellCheck={false} className="font-mono text-xs" onChange={(event) => setConfig({ ...config, modulesDirectory: event.target.value })} />
            <Button variant="secondary" disabled={busy} onClick={() => void choose()}><FolderOpenIcon className="size-4" />{t("settings.choosePath")}</Button>
          </div>
        </Field>
        <div className="flex gap-2"><Button disabled={busy} onClick={() => void save(config)}>{busy ? t("common.saving") : t("common.save")}</Button><Button variant="ghost" disabled={busy || !config.modulesDirectory} onClick={() => void save({ ...config, modulesDirectory: "" })}>{t("settings.disconnectModules")}</Button></div>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-3 md:grid-cols-2">{moduleRow(t("settings.translationModule"), status?.translation)}{moduleRow("MinerU", status?.mineru)}</div>
        <p className="text-xs text-zinc-500">{t("settings.modulesStructure")}</p>
      </div> : <p className="mt-4 text-sm text-zinc-500">{t("common.loading")}</p>}
    </Card>
  );
}
