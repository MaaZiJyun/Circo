"use client";

import { useState } from "react";
import { Button, Dialog, Field, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord, TaskRecord } from "@/shared/model/entities";

export function TaskMoveDialog({
  task,
  projects,
  onClose,
  onMove,
}: {
  task: TaskRecord;
  projects: ProjectRecord[];
  onClose: () => void;
  onMove: (projectId: string) => void;
}) {
  const { t } = useI18n();
  const choices = projects.filter((project) => project.id !== task.projectId);
  const [projectId, setProjectId] = useState(choices[0]?.id ?? "");
  return (
    <Dialog
      open
      title={t("hand.moveTask")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <p className="text-sm text-zinc-500">{task.title}</p>
        <Field label={t("hand.targetProject")}>
          <Select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            {choices.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          disabled={!projectId}
          onClick={() => {
            onMove(projectId);
            onClose();
          }}
        >
          {t("hand.moveTask")}
        </Button>
      </div>
    </Dialog>
  );
}
