"use client";

import type { SourceRecord } from "@/shared/model/entities";
import { LiteratureReader } from "./literature-reader";

export function ActiveLiteratureReader({
  source,
  onBack,
  onUpdate,
}: {
  source: SourceRecord;
  onBack: () => void;
  onUpdate: (change: Partial<SourceRecord>) => void;
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
  return (
    <LiteratureReader
      source={source}
      onBack={onBack}
      onSave={saveMarkdown}
      onUpdate={onUpdate}
    />
  );
}
