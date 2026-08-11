"use client";

import { useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  LightBulbIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SectionHeader } from "@/shared/components/page-elements";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { statusLabels, typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useFindViewModel } from "../view-models/use-find-view-model";

export function SourceWorkspace({
  vm,
  openAnnotation,
}: {
  vm: ReturnType<typeof useFindViewModel>;
  openAnnotation: () => void;
}) {
  const { t } = useI18n();
  const source = vm.selected;
  const [content, setContent] = useState(source?.content ?? "");
  const [summary, setSummary] = useState(source?.summary ?? "");
  if (!source) return null;
  const generateSummary = async () => {
    const generated = await vm.generateSummary();
    if (generated) setSummary(generated);
  };
  return (
    <div className="min-w-0 space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{source.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {source.authors} · {source.year}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label={t("find.readingStatus")}
              value={source.readingStatus}
              onChange={(event) =>
                vm.updateSource(source.id, {
                  readingStatus: event.target
                    .value as typeof source.readingStatus,
                })
              }
              className="w-auto"
            >
              {["unread", "reading", "read"].map((item) => (
                <option key={item} value={item}>
                  {t(statusLabels[item])}
                </option>
              ))}
            </Select>
            {source.fileToken && (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium dark:border-zinc-800"
                href={`/api/files/${source.fileToken}`}
                target="_blank"
              >
                <ArrowTopRightOnSquareIcon className="size-4" />
                {t("find.openOriginal")}
              </a>
            )}
            <Button
              variant="danger"
              onClick={() =>
                window.confirm(t("common.confirmDelete")) &&
                vm.deleteSource(source.id)
              }
            >
              <TrashIcon className="size-4" />
              {t("common.delete")}
            </Button>
          </div>
        </div>
        {source.conversionStatus === "failed" && (
          <div className="mt-4">
            <Alert tone="danger">{source.conversionMessage}</Alert>
          </div>
        )}
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeader
            title={t("find.original")}
            action={
              <Button
                variant="ghost"
                onClick={() => vm.updateSource(source.id, { content })}
              >
                {t("common.save")}
              </Button>
            }
          />
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-80 font-mono"
          />
        </Card>
        <Card>
          <SectionHeader
            title={t("find.guide")}
            action={
              <Button
                variant="secondary"
                disabled={vm.busy !== null || !source.content}
                onClick={() => void vm.generateGuide()}
              >
                <SparklesIcon className="size-4" />
                {t("find.translate")}
              </Button>
            }
          />
          <Alert>{t("find.aiNotice")}</Alert>
          <Textarea className="mt-4 min-h-64" value={source.guide} readOnly />
        </Card>
      </div>
      <Card>
        <SectionHeader
          title={t("find.summary")}
          action={
            <div className="flex gap-2">
              <Button variant="ghost" onClick={openAnnotation}>
                {t("find.annotation")}
              </Button>
              <Button
                variant="secondary"
                disabled={vm.busy !== null || !source.content}
                onClick={() => void generateSummary()}
              >
                {t("find.summarize")}
              </Button>
              <Button
                disabled={!summary.trim()}
                onClick={() => vm.createIdea(summary)}
              >
                <LightBulbIcon className="size-4" />
                {t("find.toIdea")}
              </Button>
            </div>
          }
        />
        <Field label={t("find.summary")}>
          <Textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            onBlur={() => vm.updateSource(source.id, { summary })}
            className="min-h-48"
          />
        </Field>
        {vm.annotations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {vm.annotations.map((item) => (
              <Badge
                key={item.id}
                tone={
                  item.kind === "positive"
                    ? "success"
                    : item.kind === "negative"
                      ? "danger"
                      : "neutral"
                }
              >
                {t(typeLabels[item.kind])} ·{" "}
                {item.location || item.quote.slice(0, 20)}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
