"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/shared/components/page-elements";
import { Button, Card, EmptyState, Select } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord } from "@/shared/model/entities";
import { useHandViewModel } from "../view-models/use-hand-view-model";
import { LogDialog, ProjectDialog, TaskDialog } from "./hand-dialogs";
import { AttachmentDialog } from "./attachment-dialog";
import { ProjectWorkspace } from "./project-workspace";

export function HandView() {
  const { t } = useI18n();
  const vm = useHandViewModel();
  const [dialog, setDialog] = useState<
    "project" | "task" | "log" | "attachment" | null
  >(null);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("hand.eyebrow")}
        title={t("hand.title")}
        subtitle={t("hand.subtitle")}
        actions={
          <Button onClick={() => setDialog("project")}>
            <PlusIcon className="size-4" />
            {t("hand.newProject")}
          </Button>
        }
      />
      {vm.projects.length ? (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-64 gap-1 text-sm font-medium">
              <span>{t("hand.selectProject")}</span>
              <Select
                value={vm.selected?.id}
                onChange={(event) => vm.setSelectedId(event.target.value)}
              >
                {vm.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </label>
            {vm.selected && (
              <label className="grid min-w-44 gap-1 text-sm font-medium">
                <span>{t("hand.projectStatus")}</span>
                <Select
                  value={vm.selected.status}
                  onChange={(event) =>
                    vm.updateProject({
                      status: event.target.value as ProjectRecord["status"],
                    })
                  }
                >
                  {[
                    "concept",
                    "planning",
                    "active",
                    "paused",
                    "completed",
                    "archived",
                  ].map((item) => (
                    <option key={item} value={item}>
                      {t(statusLabels[item])}
                    </option>
                  ))}
                </Select>
              </label>
            )}
            {vm.selected && (
              <Button
                variant="danger"
                onClick={() =>
                  window.confirm(t("common.confirmDelete")) &&
                  vm.deleteProject(vm.selected!.id)
                }
              >
                <TrashIcon className="size-4" />
                {t("common.delete")}
              </Button>
            )}
          </div>
          {vm.selected && <ProjectWorkspace vm={vm} openDialog={setDialog} />}
        </>
      ) : (
        <Card>
          <EmptyState
            title={t("common.noData")}
            action={
              <Button onClick={() => setDialog("project")}>
                {t("hand.newProject")}
              </Button>
            }
          />
        </Card>
      )}
      <ProjectDialog
        open={dialog === "project"}
        onClose={() => setDialog(null)}
        onSave={vm.addProject}
      />
      <TaskDialog
        open={dialog === "task"}
        onClose={() => setDialog(null)}
        onSave={vm.addTask}
      />
      <LogDialog
        open={dialog === "log"}
        onClose={() => setDialog(null)}
        onSave={vm.addLog}
      />
      <AttachmentDialog
        open={dialog === "attachment"}
        onClose={() => setDialog(null)}
        onSave={vm.addAttachment}
      />
    </div>
  );
}
