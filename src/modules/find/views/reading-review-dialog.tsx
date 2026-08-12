"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  Field,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type {
  LiteratureReview,
  LiteratureReviewType,
} from "@/shared/model/entities";

const reviewTypes: Array<Exclude<LiteratureReviewType, "">> = [
  "review",
  "discovery",
  "method",
  "application",
  "validation",
];

const questions: Array<{
  key: Exclude<keyof LiteratureReview, "type">;
  label:
    | "Problem"
    | "Approach"
    | "Result"
    | "Limitation"
    | "Inspiration"
    | "Structure";
}> = [
  { key: "problem", label: "Problem" },
  { key: "approach", label: "Approach" },
  { key: "result", label: "Result" },
  { key: "limitation", label: "Limitation" },
  { key: "inspiration", label: "Inspiration" },
  { key: "structure", label: "Structure" },
];

export function ReadingReviewDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: LiteratureReview;
  onClose: () => void;
  onSubmit: (review: LiteratureReview) => void;
}) {
  const { t } = useI18n();
  const [review, setReview] = useState(initial);
  const [error, setError] = useState(false);
  const submit = () => {
    if (questions.some(({ key }) => !review[key].trim())) {
      setError(true);
      return;
    }
    onSubmit(review);
    onClose();
  };
  return (
    <Dialog
      open={open}
      title={t("find.markAsRead")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("find.articleType")} hint={t("find.articleTypeHint")}>
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
        {questions.map(({ key, label }) => (
          <Field
            key={key}
            label={`${label} · ${t(`find.review.${key}`)}`}
            hint={t(`find.reviewHint.${key}`)}
          >
            <Textarea
              value={review[key]}
              onChange={(event) =>
                setReview({ ...review, [key]: event.target.value })
              }
            />
          </Field>
        ))}
        {error && (
          <p className="text-sm text-red-600">{t("common.required")}</p>
        )}
        <Button onClick={submit}>{t("find.submitAndMarkRead")}</Button>
      </div>
    </Dialog>
  );
}
