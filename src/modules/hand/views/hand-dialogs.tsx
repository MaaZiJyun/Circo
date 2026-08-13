"use client";
import { useState } from "react";
import { Button, Dialog, Field, Input, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { addDays, today } from "@/shared/model/factories";
import { parseTags } from "@/shared/model/tags";
import type { ProjectInput } from "../view-models/use-hand-view-model";
export { TaskDialog } from "./task-dialog";

export function ProjectDialog({
  open,
  onClose,
  onSave,
  initial,
  edit = false,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProjectInput) => void;
  initial?: ProjectInput;
  edit?: boolean;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<ProjectInput>(
    initial ?? {
      name: "",
      purpose: "",
      expected: "",
      startDate: today(),
      endDate: addDays(new Date(), 30),
      tags: [],
      score: 50,
    },
  );
  const [tagText, setTagText] = useState(initial?.tags.join(", ") ?? "");
  const submit = () => {
    if (!input.name.trim()) return;
    onSave({ ...input, tags: parseTags(tagText) });
    onClose();
    setInput({ ...input, name: "", purpose: "", expected: "" });
    setTagText("");
  };
  return (
    <Dialog
      open={open}
      title={edit ? t("hand.editProject") : t("hand.newProject")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("common.title")}>
          <Input value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} autoFocus />
        </Field>
        <Field label={t("hand.purpose")}>
          <Textarea value={input.purpose} onChange={(event) => setInput({ ...input, purpose: event.target.value })} />
        </Field>
        <Field label={t("hand.expected")}>
          <Textarea value={input.expected} onChange={(event) => setInput({ ...input, expected: event.target.value })} />
        </Field>
        <Field label={t("common.tags")}>
          <Input value={tagText} onChange={(event) => setTagText(event.target.value)} />
        </Field>
        <Field label={t("hand.projectScore")}>
          <Input
            type="number"
            min="0"
            max="100"
            value={input.score}
            onChange={(event) =>
              setInput({
                ...input,
                score: Math.min(100, Math.max(0, Number(event.target.value))),
              })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("hand.startDate")}>
            <Input
              type="date"
              value={input.startDate}
              onChange={(event) =>
                setInput({ ...input, startDate: event.target.value })
              }
            />
          </Field>
          <Field label={t("hand.endDate")}>
            <Input
              type="date"
              value={input.endDate}
              onChange={(event) =>
                setInput({ ...input, endDate: event.target.value })
              }
            />
          </Field>
        </div>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
