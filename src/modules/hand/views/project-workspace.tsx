"use client";

import { useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { SectionHeader } from "@/shared/components/page-elements";
import { TaskHierarchyList } from "@/shared/components/task-hierarchy-list";
import { SelectionToolbar } from "@/shared/components/selection-toolbar";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  ProgressBar,
  Select,
} from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { useHandViewModel } from "../view-models/use-hand-view-model";
import type { ActivityRecord } from "@/shared/model/entities";
import { ProjectSecondarySections } from "../sections/project-secondary-sections";
import { ProjectGantt } from "../widgets/project-gantt";
import { isLockedCompletedPastTask } from "./project-task-actions";
import { TaskRow } from "@/shared/components/task-row";

type DialogName = "task" | "log" | "attachment" | null;
export type ProjectSection = "overview" | "plan" | "logs" | "attachments";
type ViewModel = ReturnType<typeof useHandViewModel>;

export function ProjectWorkspace({
  vm,
  openDialog,
  onOpenTaskMenu,
  onEditProject,
  section,
}: {
  vm: ViewModel;
  openDialog: (dialog: DialogName, taskStartAt?: string) => void;
  onOpenTaskMenu: (task: ActivityRecord, position: { x: number; y: number }) => void;
  onEditProject: () => void;
  section: ProjectSection;
}) {
  const { t, formatDate } = useI18n();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [parentDialog, setParentDialog] = useState(false);
  const [parentId, setParentId] = useState("");
  if (!vm.selected) return null;
  const parentCandidates = vm.activities.filter((task) => !selectedTaskIds.includes(task.id));

  return (
    <>
      {section === "overview" && (
        <Card className="shadow-sm">
          <SectionHeader
            title={t("hand.projectInformation")}
            action={<Button variant="secondary" onClick={onEditProject}><PencilSquareIcon className="size-4" />{t("common.edit")}</Button>}
          />
          <div className="flex flex-col gap-5 pb-5 dark:border-zinc-800 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{vm.selected.name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{vm.selected.purpose}</p>
              <p className="mt-3 text-xs text-zinc-500">{formatDate(vm.selected.startDate)} – {formatDate(vm.selected.endDate)}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{t("common.tags")}</p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{vm.selected.tags.length ? vm.selected.tags.join(" · ") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{t("common.progress")}</p>
                  <div className="mt-2 text-xs text-zinc-500"><ProgressBar value={vm.progress} /></div>
                </div>
              </div>
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{t("hand.projectStatus")}</p>
                  <div className="mt-2"><Badge tone={vm.selected.status === "completed" ? "success" : "info"}>{t(statusLabels[vm.selected.status])}</Badge></div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{t("hand.expected")}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{vm.selected.expected || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      {section === "plan" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
          <Card className="shadow-sm">
            <SectionHeader
              title={t("hand.timeline")}
              action={<Button variant="ghost" onClick={() => openDialog("task")}><PlusIcon className="size-4" />{t("hand.newTask")}</Button>}
            />
            <ProjectGantt
              activities={vm.ganttActivities}
              focus={vm.focus}
              startDate={vm.selected.startDate}
              endDate={vm.selected.endDate}
              onUpdateTask={vm.updateTaskFromGantt}
              onCreateTask={(startAt) => openDialog("task", startAt)}
            />
            {selectedTaskIds.length > 0 && (
              <SelectionToolbar label={t("hand.selectedTasks").replace("{count}", String(selectedTaskIds.length))} onCancel={() => setSelectedTaskIds([])}>
                <Button variant="secondary" onClick={() => setParentDialog(true)}>{t("hand.setParent")}</Button>
                <Button variant="ghost" onClick={() => { vm.setTaskParent(selectedTaskIds, null); setSelectedTaskIds([]); }}>{t("hand.noParent")}</Button>
              </SelectionToolbar>
            )}
            {vm.activities.length ? (
              <TaskHierarchyList
                activities={vm.activities}
                selectedTaskIds={selectedTaskIds}
                onSetParent={vm.setTaskParent}
                renderTask={(task) => (
                  <TaskRow
                    title={task.title}
                    description={task.description}
                    status={task.status}
                    dueAt={task.dueDate}
                    completedAt={task.completedAt}
                    estimatedMinutes={task.estimatedMinutes}
                    actualMinutes={task.actualMinutes}
                    expectedOutput={task.expectedOutput}
                    milestone={task.milestone}
                    toggleDisabled={isLockedCompletedPastTask(task)}
                    onToggle={() => vm.advanceTask(task)}
                    deadlineInline
                    action={<span onClick={(event) => event.stopPropagation()}><Checkbox aria-label={task.title} checked={selectedTaskIds.includes(task.id)} onChange={() => setSelectedTaskIds((current) => current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id])} /></span>}
                    onContextMenu={(event) => { event.preventDefault(); onOpenTaskMenu(task, { x: event.clientX, y: event.clientY }); }}
                  />
                )}
              />
            ) : <EmptyState title={t("common.noData")} />}
          </Card>
        </div>
      )}
      {(section === "logs" || section === "attachments") && (
        <ProjectSecondarySections vm={vm} section={section} openDialog={(name) => openDialog(name)} />
      )}
      <Dialog open={parentDialog} title={t("hand.setParent")} closeLabel={t("common.close")} onClose={() => setParentDialog(false)}>
        <div className="grid gap-4">
          <Select value={parentId} onChange={(event) => setParentId(event.target.value)}>
            <option value="">{t("hand.chooseParent")}</option>
            {parentCandidates.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </Select>
          <Button disabled={!parentId} onClick={() => { vm.setTaskParent(selectedTaskIds, parentId); setSelectedTaskIds([]); setParentId(""); setParentDialog(false); }}>{t("hand.setParent")}</Button>
        </div>
      </Dialog>
    </>
  );
}
