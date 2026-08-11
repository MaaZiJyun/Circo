"use client";

import { useRef } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { CollectionName } from "@/shared/model/app-state";
import { useTheme } from "@/shared/theme/theme-context";
import { useStore } from "@/shared/view-models/store-context";
import { PageHeader, SectionHeader } from "./page-elements";
import { ProfileSettings } from "./profile-settings";
import { StorageSettings } from "./storage-settings";
import { Alert, Button, Card, EmptyState, Field, Select } from "./ui";

export function SettingsView() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { state, restoreItem, createArchive, restoreArchive } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  if (!state) return null;
  const trash = (
    ["goals", "sources", "ideas", "projects", "artifacts"] as CollectionName[]
  ).flatMap((collection) =>
    (
      state[collection] as {
        id: string;
        title?: string;
        name?: string;
        deletedAt?: string;
      }[]
    )
      .filter((item) => item.deletedAt)
      .map((item) => ({ ...item, collection })),
  );
  const exportBackup = async () => {
    const blob = await createArchive();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `circo-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = async (file?: File) => {
    if (!file || !window.confirm(t("settings.restoreWarning"))) return;
    await restoreArchive(file);
  };
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
        subtitle={t("app.tagline")}
      />
      <ProfileSettings />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeader title={t("settings.theme")} />
          <Field label={t("settings.theme")}>
            <Select
              value={theme}
              onChange={(event) => setTheme(event.target.value as typeof theme)}
            >
              <option value="system">{t("settings.system")}</option>
              <option value="light">{t("settings.light")}</option>
              <option value="dark">{t("settings.dark")}</option>
            </Select>
          </Field>
        </Card>
        <Card>
          <SectionHeader title={t("settings.language")} />
          <Field label={t("settings.language")}>
            <Select
              value={locale}
              onChange={(event) =>
                setLocale(event.target.value as typeof locale)
              }
            >
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </Select>
          </Field>
        </Card>
      </div>
      <StorageSettings />
      <Card>
        <SectionHeader title={t("settings.backup")} />
        <Alert tone="warning">{t("settings.restoreWarning")}</Alert>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void exportBackup()}>
            <ArrowDownTrayIcon className="size-4" />
            {t("settings.exportBackup")}
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <ArrowUpTrayIcon className="size-4" />
            {t("settings.restoreBackup")}
          </Button>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept="application/zip,.zip"
            onChange={(event) => void importBackup(event.target.files?.[0])}
          />
        </div>
      </Card>
      <Card>
        <SectionHeader title={t("settings.trash")} />
        {trash.length ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {trash.map((item) => (
              <div
                key={`${item.collection}-${item.id}`}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="text-sm">{item.title ?? item.name}</span>
                <Button
                  variant="ghost"
                  onClick={() => restoreItem(item.collection, item.id)}
                >
                  {t("common.restore")}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t("settings.trashEmpty")} />
        )}
      </Card>
    </div>
  );
}
