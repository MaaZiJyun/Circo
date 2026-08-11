"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  BeakerIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, SectionHeader } from "@/shared/components/page-elements";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import type { Idea } from "@/shared/model/entities";
import { parseTags } from "@/shared/model/tags";
import { useMindViewModel } from "../view-models/use-mind-view-model";

const methods: { value: Idea["method"]; label: MessageKey }[] = [
  { value: "combine", label: "mind.combine" },
  { value: "transfer", label: "mind.transfer" },
  { value: "alternative", label: "mind.alternative" },
  { value: "premise", label: "mind.premise" },
  { value: "followUp", label: "mind.followUp" },
  { value: "macro", label: "mind.macro" },
  { value: "micro", label: "mind.micro" },
];

function ScoreEditor({
  idea,
  onChange,
}: {
  idea: Idea;
  onChange: (scores: Idea["scores"]) => void;
}) {
  const { t } = useI18n();
  const items: { key: keyof Idea["scores"]; label: MessageKey }[] = [
    { key: "value", label: "mind.value" },
    { key: "feasibility", label: "mind.feasibility" },
    { key: "novelty", label: "mind.novelty" },
    { key: "cost", label: "mind.cost" },
    { key: "risk", label: "mind.risk" },
  ];
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <label
          key={item.key}
          className="grid grid-cols-[80px_1fr_20px] items-center gap-2 text-xs text-zinc-500"
        >
          <span>{t(item.label)}</span>
          <input
            type="range"
            min="1"
            max="5"
            value={idea.scores[item.key]}
            onChange={(event) =>
              onChange({
                ...idea.scores,
                [item.key]: Number(event.target.value),
              })
            }
          />
          <span>{idea.scores[item.key]}</span>
        </label>
      ))}
    </div>
  );
}

export function MindView() {
  const { t } = useI18n();
  const vm = useMindViewModel();
  const [capture, setCapture] = useState("");
  const [captureTags, setCaptureTags] = useState("");
  const [input, setInput] = useState("");
  const [method, setMethod] = useState<Idea["method"]>("combine");
  const submitCapture = () => {
    vm.addIdea(capture, "capture", parseTags(captureTags));
    setCapture("");
    setCaptureTags("");
  };
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("mind.eyebrow")}
        title={t("mind.title")}
        subtitle={t("mind.subtitle")}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader title={t("mind.quickCapture")} />
          <Field label={t("mind.ideaContent")}>
            <Textarea
              value={capture}
              onChange={(event) => setCapture(event.target.value)}
              placeholder={t("mind.ideaContent")}
            />
          </Field>
          <Field label={t("common.tags")}>
            <Input
              value={captureTags}
              onChange={(event) => setCaptureTags(event.target.value)}
            />
          </Field>
          <Button
            className="mt-3"
            disabled={!capture.trim()}
            onClick={submitCapture}
          >
            <PlusIcon className="size-4" />
            {t("common.add")}
          </Button>
        </Card>
        <Card>
          <SectionHeader title={t("mind.lab")} />
          <div className="grid gap-4">
            <Field label={t("mind.method")}>
              <Select
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value as Idea["method"])
                }
              >
                {methods.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.label)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("mind.input")}>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("mind.input")}
              />
            </Field>
            <Button
              disabled={!input.trim() || vm.busy}
              onClick={() => void vm.explore(input, method)}
            >
              <SparklesIcon className="size-4" />
              {t("mind.run")}
            </Button>
            {vm.candidate && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                  <BeakerIcon className="size-4" />
                  {t("mind.candidate")}
                </div>
                <p className="mt-3 text-sm leading-6">{vm.candidate}</p>
                <p className="mt-3 text-xs opacity-70">
                  {t("mind.basis")}: {vm.candidateInput}
                </p>
                <Button className="mt-4" onClick={vm.acceptCandidate}>
                  {t("mind.accept")}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
      <Card>
        <SectionHeader title={t("mind.library")} />
        {vm.ideas.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vm.ideas.map((idea) => (
              <article
                key={idea.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    tone={
                      idea.status === "converted"
                        ? "success"
                        : idea.status === "candidate"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {t(statusLabels[idea.status])}
                  </Badge>
                  <IconButton
                    label={t("common.delete")}
                    onClick={() =>
                      window.confirm(t("common.confirmDelete")) &&
                      vm.deleteIdea(idea.id)
                    }
                  >
                    <TrashIcon className="size-4" />
                  </IconButton>
                </div>
                <h3 className="mt-3 font-medium">{idea.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                  {idea.content}
                </p>
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <ScoreEditor
                    idea={idea}
                    onChange={(scores) => vm.updateScores(idea.id, scores)}
                  />
                </div>
                <Button
                  variant="secondary"
                  className="mt-4 w-full"
                  disabled={idea.status === "converted"}
                  onClick={() => vm.convertToProject(idea)}
                >
                  {t("mind.toProject")}
                  <ArrowRightIcon className="size-4" />
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t("common.noData")} />
        )}
      </Card>
      <Alert>{t("find.aiNotice")}</Alert>
    </div>
  );
}
