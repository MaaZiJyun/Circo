"use client";

import { useRef, useState } from "react";
import { Button, Dialog, Field, Input, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

export function AttachmentDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (file: File, description: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await onSave(file, description);
    onClose();
    setDescription("");
  };
  return (
    <Dialog
      open={open}
      title={t("hand.addAttachment")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("find.file")}>
          <Input type="file" ref={fileRef} />
        </Field>
        <Field label={t("hand.fileDescription")}>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Button onClick={() => void submit()}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
