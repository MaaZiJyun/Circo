"use client";

import { useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import {
  Badge,
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  LiteratureReview,
  LiteratureReviewType,
  SourceRecord,
} from "@/shared/model/entities";
import { parseTags } from "@/shared/model/tags";

const reviewKeys: Array<Exclude<keyof LiteratureReview, "type">> = [
  "problem",
  "approach",
  "result",
  "limitation",
  "inspiration",
  "structure",
];
const reviewTypes: Array<Exclude<LiteratureReviewType, "">> = [
  "review",
  "discovery",
  "method",
  "application",
  "validation",
];

function createDraft(source: SourceRecord) {
  return {
    title: source.title,
    authors: source.authors,
    origin: source.origin,
    category: source.category,
    publicationDate: source.publicationDate,
    tags: source.tags.join(", "),
    citation: source.citation,
  };
}

export function LiteratureDetailsPanel({
  source,
  onSave,
}: {
  source: SourceRecord;
  onSave: (change: Partial<SourceRecord>) => void;
}) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => createDraft(source));
  const [review, setReview] = useState(source.readingReview);
  const formatTime = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";
  const cancel = () => {
    setDraft(createDraft(source));
    setReview(source.readingReview);
    setEditing(false);
  };
  const save = () => {
    onSave({
      ...draft,
      tags: parseTags(draft.tags),
      readingReview: review,
      year: draft.publicationDate.slice(0, 4),
    });
    setEditing(false);
  };
  const input = (key: keyof typeof draft, label: string) => (
    <Field label={label}>
      <Input
        value={draft[key]}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
      />
    </Field>
  );
  if (editing)
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-semibold">{t("find.editDetailsAndReview")}</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={cancel}>
              {t("common.cancel")}
            </Button>
            <Button onClick={save}>{t("common.save")}</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {input("title", t("common.title"))}
          {input("authors", t("find.authors"))}
          {input("origin", t("find.origin"))}
          {input("category", t("find.category"))}
          {input("publicationDate", t("find.publicationDate"))}
          {input("tags", t("common.tags"))}
          <Field label={t("find.citation")}>
            <Textarea
              value={draft.citation}
              onChange={(event) =>
                setDraft({ ...draft, citation: event.target.value })
              }
              className="min-h-32 font-mono"
            />
          </Field>
        </div>
        {source.readingStatus === "read" && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label={t("find.articleType")}>
              <Select
                value={review.type}
                onChange={(event) =>
                  setReview({
                    ...review,
                    type: event.target.value as LiteratureReviewType,
                  })
                }
              >
                <option value="">{t("find.typeOptional")}</option>
                {reviewTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`find.reviewType.${type}`)}
                  </option>
                ))}
              </Select>
            </Field>
            {reviewKeys.map((key) => (
              <Field key={key} label={t(`find.review.${key}`)}>
                <Textarea
                  value={review[key]}
                  onChange={(event) =>
                    setReview({ ...review, [key]: event.target.value })
                  }
                />
              </Field>
            ))}
          </div>
        )}
      </section>
    );
  const facts = [
    [t("find.authors"), source.authors],
    [t("find.origin"), source.origin],
    [t("find.category"), source.category],
    [t("find.publicationDate"), source.publicationDate],
  ];
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {t("find.literatureProfile")}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{source.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {source.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setDraft(createDraft(source));
            setReview(source.readingReview);
            setEditing(true);
          }}
        >
          <PencilSquareIcon className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 dark:bg-zinc-950">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-sm font-medium">{value || "—"}</p>
          </div>
        ))}
      </div>
      {/* {source.citation && (
        <div className="mx-5 mb-5 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="mb-2 text-xs font-medium text-zinc-500">Citation</p>
          <pre className="whitespace-pre-wrap text-xs leading-5">
            {source.citation}
          </pre>
        </div>
      )} */}
      {source.readingStatus === "read" && (
        <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h3 className="mr-auto font-semibold">
              {t("find.readingSummary")}
            </h3>
            {source.readingReview.type && (
              <Badge tone="info">
                {t(`find.reviewType.${source.readingReview.type}`)}
              </Badge>
            )}
            <Badge>
              {source.studyDurationMinutes} {t("common.minutes")}
            </Badge>
          </div>
          <div className="mb-4 grid gap-3 text-xs text-zinc-500 sm:grid-cols-2">
            <p>
              {t("find.startedAt")}: {formatTime(source.readingStartedAt)}
            </p>
            <p>
              {t("find.completedAt")}: {formatTime(source.readingCompletedAt)}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reviewKeys.map((key) => (
              <div
                key={key}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t(`find.review.${key}`)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {source.readingReview[key] || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
