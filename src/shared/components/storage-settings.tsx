"use client";

import { useEffect, useState } from "react";
import { FolderOpenIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import {
  isStorageConfig,
  type StorageConfig,
} from "@/shared/model/storage-config";
import { useStore } from "@/shared/view-models/store-context";
import { SectionHeader } from "./page-elements";
import { Alert, Button, Card, Field, Input } from "./ui";

function responseError(value: unknown) {
  return value && typeof value === "object" && "error" in value
    ? String(value.error)
    : "Unable to save storage paths.";
}

export function StorageSettings() {
  const { t } = useI18n();
  const { reload } = useStore();
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState<"database" | "storage" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/storage-config", { cache: "no-store" })
      .then((response) => response.json())
      .then((value: unknown) => {
        if (active && isStorageConfig(value)) setConfig(value);
      })
      .catch((cause: unknown) => {
        if (active) setError(String(cause));
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/storage-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const value: unknown = await response.json();
      if (!response.ok || !isStorageConfig(value))
        throw new Error(responseError(value));
      setConfig(value);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  const pickPath = async (kind: "database" | "storage") => {
    if (!config) return;
    setPicking(kind);
    setError("");
    try {
      const response = await fetch(`/api/path-picker?kind=${kind}`, {
        method: "POST",
      });
      if (response.status === 204) return;
      const value: unknown = await response.json();
      if (!response.ok) throw new Error(responseError(value));
      if (!value || typeof value !== "object" || !("path" in value))
        throw new Error(t("settings.pickerUnavailable"));
      const selectedPath = String(value.path);
      setConfig({
        ...config,
        [kind === "database" ? "databasePath" : "storageDirectory"]:
          selectedPath,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPicking(null);
    }
  };

  return (
    <Card>
      <SectionHeader title={t("settings.storage")} />
      <Alert tone="warning">{t("settings.storageHint")}</Alert>
      {config ? (
        <div className="mt-4 grid gap-4">
          <Field label={t("settings.databasePath")}>
            <div className="flex gap-2">
              <Input
                value={config.databasePath}
                spellCheck={false}
                className="font-mono text-xs"
                onChange={(event) =>
                  setConfig({ ...config, databasePath: event.target.value })
                }
              />
              <Button
                variant="secondary"
                disabled={picking !== null}
                onClick={() => void pickPath("database")}
              >
                <FolderOpenIcon className="size-4" />
                {t("settings.choosePath")}
              </Button>
            </div>
          </Field>
          <Field label={t("settings.storageDirectory")}>
            <div className="flex gap-2">
              <Input
                value={config.storageDirectory}
                spellCheck={false}
                className="font-mono text-xs"
                onChange={(event) =>
                  setConfig({ ...config, storageDirectory: event.target.value })
                }
              />
              <Button
                variant="secondary"
                disabled={picking !== null}
                onClick={() => void pickPath("storage")}
              >
                <FolderOpenIcon className="size-4" />
                {t("settings.choosePath")}
              </Button>
            </div>
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          {error || t("common.loading")}
        </p>
      )}
    </Card>
  );
}
