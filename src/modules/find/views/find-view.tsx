"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader, SectionHeader } from "@/shared/components/page-elements";
import { Badge, Button, Card, EmptyState } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useFindViewModel } from "../view-models/use-find-view-model";
import { AnnotationDialog, ImportDialog } from "./find-dialogs";
import { SourceWorkspace } from "./source-workspace";

export function FindView() {
  const { t } = useI18n();
  const vm = useFindViewModel();
  const [dialog, setDialog] = useState<"import" | "annotation" | null>(null);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("find.eyebrow")}
        title={t("find.title")}
        subtitle={t("find.subtitle")}
        actions={
          <Button onClick={() => setDialog("import")}>
            <PlusIcon className="size-4" />
            {t("find.import")}
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card>
          <SectionHeader title={t("find.library")} />
          {vm.sources.length ? (
            <div className="grid gap-2">
              {vm.sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => vm.setSelectedId(source.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${vm.selected?.id === source.id ? "border-zinc-950 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{source.title}</p>
                    <Badge
                      tone={
                        source.conversionStatus === "failed"
                          ? "danger"
                          : source.conversionStatus === "processing"
                            ? "warning"
                            : "success"
                      }
                    >
                      {t(statusLabels[source.conversionStatus])}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {source.authors || source.fileName}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </Card>
        {vm.selected ? (
          <SourceWorkspace
            key={vm.selected.id}
            vm={vm}
            openAnnotation={() => setDialog("annotation")}
          />
        ) : (
          <Card>
            <EmptyState title={t("common.noData")} />
          </Card>
        )}
      </div>
      <ImportDialog
        open={dialog === "import"}
        onClose={() => setDialog(null)}
        onImport={vm.importSource}
      />
      <AnnotationDialog
        open={dialog === "annotation"}
        onClose={() => setDialog(null)}
        onSave={vm.addAnnotation}
      />
    </div>
  );
}
