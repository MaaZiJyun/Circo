"use client";

import { useState } from "react";
import type { Attachment, ProjectRecord } from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

export interface AttachmentPathInput {
  filePath: string;
  name: string;
  mimeType: string;
  size: number;
}

export function useAttachmentActions(selected?: ProjectRecord) {
  const { mutate } = useStore();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const addAttachment = async (file: AttachmentPathInput, description: string) => {
    if (!selected) return;
    setUploading(true);
    setUploadError(false);
    try {
      const response = await fetch("/api/attachments/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: file.filePath, projectId: selected.id }),
      });
      const registered = (await response.json()) as Partial<AttachmentPathInput> & { error?: string };
      if (!response.ok || !registered.filePath) throw new Error(registered.error || "Register failed");
      const stamp = now();
      const attachment: Attachment = {
        id: createId("attachment"), projectId: selected.id, name: registered.name ?? file.name,
        filePath: registered.filePath, mimeType: registered.mimeType ?? file.mimeType,
        size: registered.size ?? file.size,
        description, status: "available", createdAt: stamp, updatedAt: stamp,
      };
      mutate((current) => ({ ...current, attachments: [...current.attachments, attachment] }));
    } catch (error) {
      setUploadError(true);
      throw error;
    }
    finally { setUploading(false); }
  };
  const duplicateAttachments = (ids: string[]) => {
    const stamp = now();
    mutate((current) => ({ ...current, attachments: [
      ...current.attachments,
      ...current.attachments.filter((item) => ids.includes(item.id)).map((item) => ({
        ...item, id: createId("attachment"), name: `${item.name} copy`,
        createdAt: stamp, updatedAt: stamp, deletedAt: undefined,
      })),
    ] }));
  };
  const moveAttachments = (ids: string[], projectId: string) => mutate((current) => ({
    ...current,
    attachments: current.attachments.map((item) => ids.includes(item.id)
      ? { ...item, projectId, updatedAt: now() } : item),
  }));
  const deleteAttachments = (ids: string[]) => {
    const stamp = now();
    mutate((current) => ({ ...current, attachments: current.attachments.map((item) =>
      ids.includes(item.id) ? { ...item, deletedAt: stamp, updatedAt: stamp } : item,
    ) }));
  };
  return { uploading, uploadError, addAttachment, duplicateAttachments, moveAttachments, deleteAttachments };
}
