"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/shared/components/page-elements";
import { Card, DescriptionList } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";

type DbInfo = {
  path: string;
  sizeBytes: number;
  walSizeBytes: number;
  journalMode: string;
  tables: string[];
  rowCount: number;
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  collections: Record<string, number>;
  tableRowCounts?: Record<string, number>;
};

const COLLECTIONS: { key: string; label: MessageKey }[] = [
  { key: "sources", label: "me.dbSources" },
  { key: "ideas", label: "me.dbIdeas" },
  { key: "projects", label: "me.dbProjects" },
  { key: "activities", label: "me.dbTasks" },
  { key: "messages", label: "me.dbMessages" },
  { key: "logs", label: "me.dbLogs" },
  { key: "attachments", label: "me.dbAttachments" },
  { key: "points", label: "me.dbPoints" },
  { key: "annotations", label: "me.dbAnnotations" },
  { key: "artifacts", label: "me.dbArtifacts" },
  { key: "cycles", label: "me.dbCycles" },
  { key: "goals", label: "me.dbGoals" },
  { key: "sessions", label: "me.dbSessions" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DatabaseInfoPanel() {
  const { t, formatNumber, locale } = useI18n();
  const [info, setInfo] = useState<DbInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/db-info", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<DbInfo>;
      })
      .then((data) => {
        if (active) setInfo(data);
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "Request failed.");
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <Card className="shadow-sm">
        <p className="text-sm text-red-600 dark:text-red-400">
          {t("common.error")}: {error}
        </p>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card className="shadow-sm">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          {t("common.loading")}
        </p>
      </Card>
    );
  }

  const updatedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(info.updatedAt));

  const rows = [
    { label: t("me.dbPath"), value: info.path },
    {
      label: t("me.dbSize"),
      value: formatBytes(info.sizeBytes + info.walSizeBytes),
    },
    { label: t("me.dbJournalMode"), value: info.journalMode.toUpperCase() },
    { label: t("me.dbSchemaVersion"), value: String(info.schemaVersion) },
    { label: t("me.dbRevision"), value: formatNumber(info.revision) },
    { label: t("me.dbUpdatedAt"), value: updatedAt },
    { label: t("me.dbTableCount"), value: formatNumber(info.tables.length) },
    { label: t("me.dbRowCount"), value: formatNumber(info.rowCount) },
  ];

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <SectionHeader title={t("me.dbTitle")} />
        <DescriptionList items={rows} variant="row" divided tabular />
      </Card>

      <Card className="shadow-sm">
        <SectionHeader title={t("me.dbDataTitle")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLLECTIONS.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60"
            >
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t(label)}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatNumber(info.collections[key] ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="shadow-sm">
        <SectionHeader title={t("me.dbTablesTitle")} />
        <div className="grid gap-2 sm:grid-cols-2">
          {info.tables
            .filter((table) => table !== "sqlite_sequence")
            .map((table) => (
              <div
                key={table}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60"
              >
                <code className="text-xs">{table}</code>
                <span className="tabular-nums text-zinc-500">
                  {formatNumber(info.tableRowCounts?.[table] ?? 0)}
                </span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
