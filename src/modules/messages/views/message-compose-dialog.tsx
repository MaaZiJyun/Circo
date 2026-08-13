"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageReferenceKind } from "@/shared/model/message";
import type { MessageInput } from "../view-models/use-messages";

type Reference = { kind: MessageReferenceKind; id: string; label: string };
const futureDate = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export function MessageComposeDialog({ references, initial, onClose, onSend }: {
  references: Reference[];
  initial?: { subject: string; body: string };
  onClose: () => void;
  onSend: (input: MessageInput) => void;
}) {
  const { t } = useI18n();
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [mode, setMode] = useState<"scheduled" | "random">("scheduled");
  const [deliverAt, setDeliverAt] = useState(futureDate());
  const [selected, setSelected] = useState<Reference[]>([]);
  const [attachments, setAttachments] = useState<MessageInput["attachments"]>([]);
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/attachments", { method: "POST", body: form });
      const payload = await response.json() as { fileToken?: string };
      if (response.ok && payload.fileToken) setAttachments((items) => [...items, {
        name: file.name, fileToken: payload.fileToken!, mimeType: file.type, size: file.size,
      }]);
    } finally { setUploading(false); }
  };
  const send = () => {
    if (!subject.trim() || !body.trim()) return;
    const randomAt = new Date(Date.now() + (7 + Math.random() * 358) * 86400000).toISOString();
    onSend({ subject: subject.trim(), body: body.trim(), deliveryMode: mode,
      deliverAt: mode === "random" ? randomAt : new Date(deliverAt).toISOString(),
      references: selected, attachments });
    onClose();
  };
  return (
    <Dialog open title={t("messages.compose")} closeLabel={t("common.close")} onClose={onClose}>
      <div className="grid gap-4">
        <Field label={t("messages.recipient")}><Input value={t("messages.futureSelf")} disabled /></Field>
        <Field label={t("messages.subject")}><Input value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus /></Field>
        <Field label={t("messages.body")}><Textarea value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("messages.deliveryMode")}><Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="scheduled">{t("messages.scheduled")}</option><option value="random">{t("messages.random")}</option>
          </Select></Field>
          {mode === "scheduled" && <Field label={t("messages.deliverAt")}><Input type="datetime-local" value={deliverAt} min={futureDate()} onChange={(e) => setDeliverAt(e.target.value)} /></Field>}
        </div>
        <Field label={t("messages.references")}>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
            {references.map((item) => <label key={`${item.kind}-${item.id}`} className="flex gap-2 p-2 text-sm">
              <input type="checkbox" checked={selected.some((value) => value.kind === item.kind && value.id === item.id)}
                onChange={(e) => setSelected((values) => e.target.checked ? [...values, item] : values.filter((value) => value.kind !== item.kind || value.id !== item.id))} />
              <span className="text-zinc-500">{t(`messages.reference.${item.kind}`)}</span><span>{item.label}</span>
            </label>)}
          </div>
        </Field>
        <Field label={t("messages.attachments")}><Input type="file" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} />
          <p className="mt-2 text-xs text-zinc-500">{attachments.map((item) => item.name).join(" · ")}</p>
        </Field>
        <Button disabled={uploading || !subject.trim() || !body.trim()} onClick={send}>{t("messages.send")}</Button>
      </div>
    </Dialog>
  );
}
