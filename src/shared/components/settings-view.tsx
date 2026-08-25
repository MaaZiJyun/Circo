"use client";

import { useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { CollectionName } from "@/shared/model/app-state";
import { useTheme } from "@/shared/theme/theme-context";
import { useStore } from "@/shared/view-models/store-context";
import { MatrixFormulaSettings } from "@/modules/me/views/matrix-formula-settings";
import { BackgroundMusicSettings } from "./background-music-settings";
import { SectionHeader } from "./page-elements";
import { ProfileSettings } from "./profile-settings";
import { StorageSettings } from "./storage-settings";
import { TaskPreprocessingSettings } from "./task-preprocessing-settings";
import { Alert, Button, Card, EmptyState, Field, Select, Tabs } from "./ui";

type SettingsTab = "general" | "tasks" | "media" | "data" | "trash";

const trashCollections: CollectionName[] = [
  "cycles",
  "goals",
  "sessions",
  "events",
  "sources",
  "libraryLists",
  "projectLists",
  "taskLists",
  "ideaLists",
  "pointLists",
  "points",
  "annotations",
  "ideas",
  "projects",
  "tasks",
  "dailyTasks",
  "logs",
  "attachments",
  "artifacts",
  "relations",
  "aiJobs",
  "messages",
];

export function SettingsView() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const {
    state,
    restoreItem,
    purgeItem,
    createArchive,
    restoreArchive,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<SettingsTab>("general");
  if (!state) return null;

  const trash = (
    trashCollections
  ).flatMap((collection) =>
    (
      state[collection] as {
        id: string;
        title?: string;
        name?: string;
        label?: string;
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
    anchor.download = `Circo-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = async (file?: File) => {
    if (!file || !window.confirm(t("settings.restoreWarning"))) return;
    await restoreArchive(file);
  };

  return (
    <div className="space-y-8">
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "general", label: t("settings.tabGeneral") },
          { value: "tasks", label: t("settings.tabTasks") },
          { value: "media", label: t("settings.tabMedia") },
          { value: "data", label: t("settings.tabData") },
          { value: "trash", label: t("settings.tabTrash") },
        ]}
      />

      {tab === "general" && (
        <div className="space-y-8">
          <ProfileSettings />
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionHeader title={t("settings.theme")} />
              <Field label={t("settings.theme")}>
                <Select
                  value={theme}
                  onChange={(event) =>
                    setTheme(event.target.value as typeof theme)
                  }
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
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-8">
          <MatrixFormulaSettings />
          <TaskPreprocessingSettings />
        </div>
      )}

      {tab === "media" && <BackgroundMusicSettings />}

      {tab === "data" && (
        <div className="space-y-8">
          <StorageSettings />
          <Card>
            <SectionHeader title={t("settings.backup")} />
            <Alert tone="warning">{t("settings.restoreWarning")}</Alert>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void exportBackup()}>
                <ArrowDownTrayIcon className="size-4" />
                {t("settings.exportBackup")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => fileRef.current?.click()}
              >
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
        </div>
      )}

      {tab === "trash" && (
        <Card>
          <SectionHeader title={t("settings.trash")} />
          {trash.length ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {trash.map((item) => (
                <div
                  key={`${item.collection}-${item.id}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {item.title ?? item.name ?? item.label ?? item.id}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.collection}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => restoreItem(item.collection, item.id)}
                    >
                      {t("common.restore")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(t("settings.confirmDeleteForever"))) {
                          purgeItem(item.collection, item.id);
                        }
                      }}
                    >
                      {t("settings.deleteForever")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("settings.trashEmpty")} />
          )}
        </Card>
      )}
    </div>
  );
}
