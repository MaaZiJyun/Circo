"use client";

import { useMemo, useState } from "react";
import { LocalAssistant } from "@/shared/infrastructure/local-assistant";
import { citationMetadata } from "../model/bibtex";
import { emptyReadingReview } from "../model/reading-record";
import { useI18n } from "@/shared/i18n/i18n-context";
import { activeItems } from "@/shared/model/app-state";
import type {
  AIJob,
  Annotation,
  Idea,
  Relation,
  SourceRecord,
} from "@/shared/model/entities";
import { createId, now } from "@/shared/model/factories";
import { useStore } from "@/shared/view-models/store-context";

const assistant = new LocalAssistant();

interface ConversionResult {
  content?: string;
  pages?: number;
  fileToken?: string;
  filePath?: string;
  markdownToken?: string;
  markdownPath?: string;
  conversionError?: string;
  error?: string;
}

export type AnnotationInput = Pick<
  Annotation,
  "location" | "quote" | "kind" | "reason"
>;

export function useFindViewModel() {
  const { state, mutate, softDelete } = useStore();
  const { locale } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"import" | "guide" | "summary" | null>(null);
  const sources = useMemo(
    () =>
      state
        ? activeItems(state.sources)
            .slice()
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        : [],
    [state],
  );
  const selected = sources.find((item) => item.id === selectedId) ?? sources[0];
  const annotations = useMemo(
    () =>
      state && selected
        ? activeItems(state.annotations).filter(
            (item) => item.sourceId === selected.id,
          )
        : [],
    [state, selected],
  );

  const updateSource = (id: string, change: Partial<SourceRecord>) => {
    mutate((current) => ({
      ...current,
      sources: current.sources.map((item) =>
        item.id === id ? { ...item, ...change, updatedAt: now() } : item,
      ),
    }));
  };

  const importSource = async (file: File, citation: string) => {
    const metadata = citationMetadata(citation);
    const id = createId("source");
    const stamp = now();
    const extension = file.name.split(".").pop()?.toLowerCase();
    const source: SourceRecord = {
      id,
      title: metadata.title,
      authors: metadata.authors,
      year: metadata.publicationDate,
      origin: metadata.origin,
      citation,
      category: metadata.category,
      fileName: file.name,
      fileToken: "",
      filePath: "",
      markdownToken: "",
      markdownPath: "",
      fileType: extension === "pdf" ? "pdf" : "markdown",
      content: "",
      summary: "",
      guide: "",
      tags: metadata.tags,
      listIds: ["library_default"],
      favorite: false,
      rating: 0,
      publicationDate: metadata.publicationDate,
      readingStatus: "unread",
      studyDurationMinutes: 0,
      readingReview: emptyReadingReview(),
      conversionStatus: "processing",
      conversionMessage: "",
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      sources: [...current.sources, source],
    }));
    setSelectedId(id);
    setBusy("import");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/convert", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as ConversionResult;
      if (!response.ok) throw new Error(result.error || "Conversion failed.");
      updateSource(id, {
        content: result.content ?? "",
        fileToken: result.fileToken ?? "",
        filePath: result.filePath ?? "",
        markdownToken: result.markdownToken ?? "",
        markdownPath: result.markdownPath ?? "",
        conversionStatus: result.conversionError ? "failed" : "ready",
        conversionMessage: result.conversionError ?? String(result.pages ?? 0),
      });
    } catch (error) {
      updateSource(id, {
        conversionStatus: "failed",
        conversionMessage:
          error instanceof Error ? error.message : "Conversion failed.",
      });
    } finally {
      setBusy(null);
    }
  };

  const recordJob = (
    taskType: AIJob["taskType"],
    entityId: string,
    inputLabel: string,
    output: string,
  ) => {
    const stamp = now();
    const job: AIJob = {
      id: createId("ai"),
      taskType,
      entityId,
      inputLabel,
      output,
      status: "success",
      provider: "local-demo",
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({ ...current, aiJobs: [...current.aiJobs, job] }));
  };

  const generateGuide = async () => {
    if (!selected) return;
    setBusy("guide");
    const guide = await assistant.guide(selected, locale);
    updateSource(selected.id, { guide, readingStatus: "reading" });
    recordJob("guide", selected.id, selected.fileName || selected.title, guide);
    setBusy(null);
  };

  const generateSummary = async () => {
    if (!selected) return;
    setBusy("summary");
    const summary = await assistant.summarize(selected, locale);
    updateSource(selected.id, { summary, readingStatus: "read" });
    recordJob(
      "summary",
      selected.id,
      selected.fileName || selected.title,
      summary,
    );
    setBusy(null);
    return summary;
  };

  const addAnnotation = (input: AnnotationInput) => {
    if (!selected) return;
    const stamp = now();
    const annotation: Annotation = {
      id: createId("annotation"),
      sourceId: selected.id,
      ...input,
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      annotations: [...current.annotations, annotation],
    }));
  };

  const createIdea = (draft?: string) => {
    const summary = draft ?? selected?.summary ?? "";
    if (!selected || !summary.trim()) return;
    const stamp = now();
    const idea: Idea = {
      id: createId("idea"),
      title: selected.title,
      content: summary,
      definition: summary,
      reason: `从《${selected.title}》的结构化总结产生。`,
      date: stamp.slice(0, 10),
      status: "spark",
      method: "capture",
      sourceIds: [selected.id],
      tags: selected.tags,
      scores: { value: 3, feasibility: 3, novelty: 3, cost: 3, risk: 3 },
      createdAt: stamp,
      updatedAt: stamp,
    };
    const relation: Relation = {
      id: createId("relation"),
      fromKind: "source",
      fromId: selected.id,
      toKind: "idea",
      toId: idea.id,
      relation: "derived",
      createdBy: "user",
      createdAt: stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      sources: current.sources.map((item) =>
        item.id === selected.id ? { ...item, summary, updatedAt: stamp } : item,
      ),
      ideas: [...current.ideas, idea],
      relations: [...current.relations, relation],
    }));
  };

  return {
    sources,
    selected,
    selectedId,
    setSelectedId,
    annotations,
    busy,
    importSource,
    updateSource,
    generateGuide,
    generateSummary,
    addAnnotation,
    createIdea,
    deleteSource: (id: string) => softDelete("sources", id),
  };
}
