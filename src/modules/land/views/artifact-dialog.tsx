"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Select } from "@/shared/components/ui";
import { typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Artifact, ProjectRecord } from "@/shared/model/entities";
import { parseTags } from "@/shared/model/tags";
import type { ArtifactInput } from "../view-models/use-land-view-model";

export function ArtifactDialog({
  open,
  onClose,
  projects,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  projects: ProjectRecord[];
  onSave: (input: ArtifactInput) => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Artifact["type"]>("blog");
  const [projectId, setProjectId] = useState("");
  const [tags, setTags] = useState("");
  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title,
      type,
      tags: parseTags(tags),
      projectId: projectId || projects[0]?.id || "",
    });
    onClose();
    setTitle("");
    setTags("");
  };
  return (
    <Dialog
      open={open}
      title={t("land.newArtifact")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("common.title")}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
        </Field>
        <Field label={t("land.artifactType")}>
          <Select
            value={type}
            onChange={(event) =>
              setType(event.target.value as Artifact["type"])
            }
          >
            {["paper", "poster", "slides", "social", "blog", "custom"].map(
              (item) => (
                <option key={item} value={item}>
                  {t(typeLabels[item])}
                </option>
              ),
            )}
          </Select>
        </Field>
        <Field label={t("land.selectProject")}>
          <Select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">—</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.tags")}>
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </Field>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
