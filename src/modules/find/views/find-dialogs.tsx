"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import { typeLabels } from "@/shared/i18n/domain-labels";
import type { AnnotationInput } from "../view-models/use-find-view-model";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/ui";

export function ImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (
    file: File,
    title: string,
    authors: string,
    tags: string,
  ) => Promise<void>;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [tags, setTags] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await onImport(file, title, authors, tags);
    onClose();
    setTitle("");
    setAuthors("");
    setTags("");
  };
  return (
    <Dialog
      open={open}
      title={t("find.import")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <p className="text-sm text-zinc-500">{t("find.uploadHint")}</p>
        <Field label={t("find.file")}>
          <Input ref={fileRef} type="file" accept=".pdf,.md,.markdown,.txt" />
        </Field>
        <Field label={t("common.title")}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label={t("find.authors")}>
          <Input
            value={authors}
            onChange={(event) => setAuthors(event.target.value)}
          />
        </Field>
        <Field label={t("common.tags")}>
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </Field>
        <Button onClick={() => void submit()}>{t("find.import")}</Button>
      </div>
    </Dialog>
  );
}

export function AnnotationDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: AnnotationInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<AnnotationInput>({
    location: "",
    quote: "",
    kind: "neutral",
    reason: "",
  });
  const submit = () => {
    if (!input.quote.trim()) return;
    onSave(input);
    onClose();
    setInput({ location: "", quote: "", kind: "neutral", reason: "" });
  };
  return (
    <Dialog
      open={open}
      title={t("find.annotation")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("find.annotationKind")}>
            <Select
              value={input.kind}
              onChange={(event) =>
                setInput({
                  ...input,
                  kind: event.target.value as AnnotationInput["kind"],
                })
              }
            >
              {["positive", "negative", "neutral"].map((item) => (
                <option key={item} value={item}>
                  {t(typeLabels[item])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("find.location")}>
            <Input
              value={input.location}
              onChange={(event) =>
                setInput({ ...input, location: event.target.value })
              }
            />
          </Field>
        </div>
        <Field label={t("find.quote")}>
          <Textarea
            value={input.quote}
            onChange={(event) =>
              setInput({ ...input, quote: event.target.value })
            }
          />
        </Field>
        <Field label={t("find.annotationReason")}>
          <Textarea
            value={input.reason}
            onChange={(event) =>
              setInput({ ...input, reason: event.target.value })
            }
          />
        </Field>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
