"use client";

import type { SourceRecord } from "@/shared/model/entities";
import type { ReferencePoint } from "@/shared/model/entities";
import { uploadSourceFile } from "../model/source-file-upload";
import { LiteratureReader } from "./literature-reader";

export function ActiveLiteratureReader({
  source,
  onBack,
  onUpdate,
  pointCount,
  onCreatePoint,
}: {
  source: SourceRecord;
  onBack: () => void;
  onUpdate: (change: Partial<SourceRecord>) => void;
  pointCount: number;
  onCreatePoint: (
    point: Omit<ReferencePoint, "id" | "createdAt" | "updatedAt">,
  ) => void;
}) {
  const saveMarkdown = async (content: string) => {
    if (source.markdownToken) {
      const response = await fetch("/api/library-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdownToken: source.markdownToken, content }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to save Markdown.");
      }
    }
    onUpdate({ content });
  };
  const convertPdf = async () => {
    if (!source.fileToken || source.fileType !== "pdf")
      throw new Error("Original PDF is unavailable.");
    const response = await fetch(`/api/files/${source.fileToken}`);
    if (!response.ok) throw new Error("Unable to load the original PDF.");
    const file = new File(
      [await response.blob()],
      source.fileName.toLowerCase().endsWith(".pdf")
        ? source.fileName
        : `${source.title}.pdf`,
      { type: "application/pdf" },
    );
    const converted = await uploadSourceFile(file);
    if (converted.conversionStatus === "failed") {
      await fetch("/api/library-files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileToken: converted.fileToken,
          markdownToken: converted.markdownToken,
        }),
      });
      throw new Error(converted.conversionMessage || "Conversion failed.");
    }

    const previousFiles = {
      fileToken: source.fileToken,
      markdownToken: source.markdownToken,
    };
    onUpdate(converted);
    await fetch("/api/library-files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previousFiles),
    });
    return converted.content ?? "";
  };
  return (
    <LiteratureReader
      source={source}
      onBack={onBack}
      onSave={saveMarkdown}
      onConvert={convertPdf}
      onUpdate={onUpdate}
      pointCount={pointCount}
      onCreatePoint={onCreatePoint}
    />
  );
}
