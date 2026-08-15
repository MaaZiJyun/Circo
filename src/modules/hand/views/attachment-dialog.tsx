"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

import type { AttachmentPathInput } from "../view-models/use-attachment-actions";

export function AttachmentDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (file: AttachmentPathInput, description: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<AttachmentPathInput | null>(null);
  const [selecting, setSelecting] = useState(false);

  const chooseFile = async () => {
    setSelecting(true);
    try {
      const picker = await fetch("/api/path-picker?kind=attachment", { method: "POST" });
      if (picker.status === 204) return;
      const picked = (await picker.json()) as { path?: string };
      if (!picker.ok || !picked.path) throw new Error("Picker failed");
      const response = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: picked.path }),
      });
      const metadata = (await response.json()) as AttachmentPathInput;
      if (!response.ok) throw new Error("File inspection failed");
      setFile(metadata);
    } finally {
      setSelecting(false);
    }
  };
  const submit = async () => {
    if (!file) return;
    await onSave(file, description);
    onClose();
    setFile(null);
    setDescription("");
  };
  return (
    <Dialog open={open} title={t("hand.addAttachment")} closeLabel={t("common.close")} onClose={onClose}>
      <div className="grid gap-4">
        <Field label={t("find.file")}>
          <div className="flex gap-2">
            <Input value={file?.filePath ?? ""} readOnly placeholder={t("hand.chooseOriginalFile")} />
            <Button variant="secondary" disabled={selecting} onClick={() => void chooseFile()}>
              {t("common.browse")}
            </Button>
          </div>
        </Field>
        <Field label={t("hand.fileDescription")}>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Button disabled={!file} onClick={() => void submit()}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
