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
      const stamp = now();
      const attachment: Attachment = {
        id: createId("attachment"), projectId: selected.id, name: file.name,
        filePath: file.filePath, mimeType: file.mimeType, size: file.size,
        description, status: "available", createdAt: stamp, updatedAt: stamp,
      };
      mutate((current) => ({ ...current, attachments: [...current.attachments, attachment] }));
    } catch { setUploadError(true); }
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
