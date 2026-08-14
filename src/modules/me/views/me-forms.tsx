"use client";

import { useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import { categoryLabels, typeLabels } from "@/shared/i18n/domain-labels";
import type { EventReason } from "@/shared/model/entities";
import type {
  EventInput,
  SessionInput,
} from "../view-models/use-me-view-model";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Switch,
  Textarea,
} from "@/shared/components/ui";

export function SessionDialog({
  open,
  onClose,
  onSave,
  goals,
  projects,
  tasks,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: SessionInput) => void;
  goals: { id: string; title: string }[];
  projects: { id: string; name: string }[];
  tasks: { id: string; projectId: string; title: string }[];
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<SessionInput>({
    title: "",
    minutes: 30,
    effective: true,
    focus: 4,
    output: "",
    note: "",
    goalId: undefined,
    projectId: undefined,
    taskId: undefined,
  });
  const submit = () => {
    if (!input.title.trim()) return;
    onSave(input);
    onClose();
    setInput({ ...input, title: "", output: "", note: "" });
  };
  return (
    <Dialog
      open={open}
      title={t("me.logTime")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("me.sessionTitle")}>
          <Input
            value={input.title}
            onChange={(event) =>
              setInput({ ...input, title: event.target.value })
            }
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("me.duration")}>
            <Input
              type="number"
              min="1"
              value={input.minutes}
              onChange={(event) =>
                setInput({ ...input, minutes: Number(event.target.value) })
              }
            />
          </Field>
          <Field label={t("me.focus")}>
            <Input
              type="number"
              min="1"
              max="5"
              value={input.focus}
              onChange={(event) =>
                setInput({ ...input, focus: Number(event.target.value) })
              }
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={input.effective}
            onChange={(checked) =>
              setInput({ ...input, effective: checked })
            }
          />
          {t("me.effective")}
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("me.relatedGoal")}>
            <Select
              value={input.goalId ?? ""}
              onChange={(event) =>
                setInput({ ...input, goalId: event.target.value || undefined })
              }
            >
              <option value="">—</option>
              {goals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("me.relatedProject")}>
            <Select
              value={input.projectId ?? ""}
              onChange={(event) =>
                setInput({
                  ...input,
                  projectId: event.target.value || undefined,
                  taskId: undefined,
                })
              }
            >
              <option value="">—</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("me.relatedTask")}>
            <Select
              value={input.taskId ?? ""}
              onChange={(event) =>
                setInput({ ...input, taskId: event.target.value || undefined })
              }
            >
              <option value="">—</option>
              {tasks
                .filter(
                  (item) =>
                    !input.projectId || item.projectId === input.projectId,
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
        <Field label={t("me.output")}>
          <Textarea
            value={input.output}
            onChange={(event) =>
              setInput({ ...input, output: event.target.value })
            }
          />
        </Field>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}

export function EventDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: EventInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<EventInput>({
    type: "success",
    phenomenon: "",
    reason: "",
    impact: "",
    evidence: "",
    action: "",
    category: "method",
  });
  const change = (key: keyof EventInput, value: string) =>
    setInput({ ...input, [key]: value });
  const submit = () => {
    if (!input.phenomenon.trim() || !input.reason.trim()) return;
    onSave(input);
    onClose();
    setInput({
      ...input,
      phenomenon: "",
      reason: "",
      impact: "",
      evidence: "",
      action: "",
    });
  };
  const categories: EventReason["category"][] = [
    "method",
    "knowledge",
    "plan",
    "communication",
    "resource",
    "external",
  ];
  return (
    <Dialog
      open={open}
      title={t("me.recordEvent")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("me.eventType")}>
            <Select
              value={input.type}
              onChange={(event) => change("type", event.target.value)}
            >
              {["success", "error", "general"].map((item) => (
                <option key={item} value={item}>
                  {t(typeLabels[item])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("me.category")}>
            <Select
              value={input.category}
              onChange={(event) => change("category", event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {t(categoryLabels[item])}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {(
          ["phenomenon", "reason", "impact", "evidence", "action"] as const
        ).map((key) => (
          <Field key={key} label={t(`me.${key}`)}>
            <Textarea
              value={input[key]}
              onChange={(event) => change(key, event.target.value)}
            />
          </Field>
        ))}
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
