"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/shared/components/page-elements";
import { Button, Card, EmptyState, Select } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Artifact } from "@/shared/model/entities";
import { useLandViewModel } from "../view-models/use-land-view-model";
import { ArtifactDialog } from "./artifact-dialog";
import { ArtifactWorkspace } from "./artifact-workspace";

export function LandView() {
  const { t } = useI18n();
  const vm = useLandViewModel();
  const [dialog, setDialog] = useState(false);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("land.eyebrow")}
        title={t("land.title")}
        subtitle={t("land.subtitle")}
        actions={
          <Button onClick={() => setDialog(true)}>
            <PlusIcon className="size-4" />
            {t("land.newArtifact")}
          </Button>
        }
      />
      {vm.artifacts.length ? (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-72 gap-1 text-sm font-medium">
              <span>{t("land.selectArtifact")}</span>
              <Select
                value={vm.selected?.id}
                onChange={(event) => vm.setSelectedId(event.target.value)}
              >
                {vm.artifacts.map((artifact) => (
                  <option key={artifact.id} value={artifact.id}>
                    {artifact.title}
                  </option>
                ))}
              </Select>
            </label>
            {vm.selected && (
              <label className="grid min-w-44 gap-1 text-sm font-medium">
                <span>{t("common.status")}</span>
                <Select
                  value={vm.selected.status}
                  onChange={(event) =>
                    vm.updateArtifact({
                      status: event.target.value as Artifact["status"],
                    })
                  }
                >
                  {["draft", "review", "final", "published", "archived"].map(
                    (item) => (
                      <option key={item} value={item}>
                        {t(statusLabels[item])}
                      </option>
                    ),
                  )}
                </Select>
              </label>
            )}
            {vm.selected && (
              <Button
                variant="danger"
                onClick={() =>
                  window.confirm(t("common.confirmDelete")) &&
                  vm.deleteArtifact(vm.selected!.id)
                }
              >
                <TrashIcon className="size-4" />
                {t("common.delete")}
              </Button>
            )}
          </div>
          {vm.selected && <ArtifactWorkspace key={vm.selected.id} vm={vm} />}
        </>
      ) : (
        <Card>
          <EmptyState
            title={t("common.noData")}
            action={
              <Button onClick={() => setDialog(true)}>
                {t("land.newArtifact")}
              </Button>
            }
          />
        </Card>
      )}
      <ArtifactDialog
        open={dialog}
        onClose={() => setDialog(false)}
        projects={vm.projects}
        onSave={vm.addArtifact}
      />
    </div>
  );
}
