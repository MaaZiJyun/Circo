"use client";

import { useState } from "react";
import {
  ArrowDownTrayIcon,
  PrinterIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { SectionHeader } from "@/shared/components/page-elements";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Tabs,
  Textarea,
} from "@/shared/components/ui";
import { statusLabels, typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useLandViewModel } from "../view-models/use-land-view-model";

export function ArtifactWorkspace({
  vm,
}: {
  vm: ReturnType<typeof useLandViewModel>;
}) {
  const { t } = useI18n();
  const artifact = vm.selected;
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [content, setContent] = useState(artifact?.content ?? "");
  const [publish, setPublish] = useState({
    channel: artifact?.channel ?? "",
    externalUrl: artifact?.externalUrl ?? "",
    feedback: artifact?.feedback ?? "",
  });
  if (!artifact) return null;
  const generate = async () => {
    const output = await vm.generateDraft();
    if (output) setContent(output);
  };
  return (
    <>
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex gap-2">
              <Badge>{t(typeLabels[artifact.type])}</Badge>
              <Badge
                tone={
                  artifact.status === "published" || artifact.status === "final"
                    ? "success"
                    : "warning"
                }
              >
                {t(statusLabels[artifact.status])}
              </Badge>
            </div>
            <h2 className="mt-3 text-2xl font-semibold">{artifact.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {artifact.materials.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => vm.exportMarkdown(content)}
            >
              <ArrowDownTrayIcon className="size-4" />
              {t("land.exportMarkdown")}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <PrinterIcon className="size-4" />
              {t("land.printPdf")}
            </Button>
            <Button disabled={vm.busy} onClick={() => void generate()}>
              <SparklesIcon className="size-4" />
              {t("common.generate")}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Alert>{t("land.aiNotice")}</Alert>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <Card className="artifact-print">
          <div className="mb-4">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "editor", label: t("land.editor") },
                { value: "preview", label: t("land.preview") },
              ]}
            />
          </div>
          {tab === "editor" ? (
            <>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[520px] font-mono"
              />
              <Button
                className="mt-3"
                onClick={() => vm.updateArtifact({ content })}
              >
                {t("common.save")}
              </Button>
            </>
          ) : (
            <pre className="min-h-[520px] whitespace-pre-wrap font-sans text-sm leading-7">
              {content}
            </pre>
          )}
        </Card>
        <Card>
          <SectionHeader title={t("land.publishInfo")} />
          <div className="grid gap-4">
            <Field label={t("land.channel")}>
              <Input
                value={publish.channel}
                onChange={(event) =>
                  setPublish({ ...publish, channel: event.target.value })
                }
              />
            </Field>
            <Field label={t("land.url")}>
              <Input
                type="url"
                value={publish.externalUrl}
                onChange={(event) =>
                  setPublish({ ...publish, externalUrl: event.target.value })
                }
              />
            </Field>
            <Field label={t("land.feedback")}>
              <Textarea
                value={publish.feedback}
                onChange={(event) =>
                  setPublish({ ...publish, feedback: event.target.value })
                }
              />
            </Field>
            <Button
              variant="secondary"
              onClick={() => vm.updateArtifact(publish)}
            >
              {t("common.save")}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
