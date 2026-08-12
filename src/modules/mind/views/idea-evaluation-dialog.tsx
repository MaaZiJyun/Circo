"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  Field,
  Textarea,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import type { Idea, IdeaDimension } from "@/shared/model/entities";
import { dimensions, evaluationQuestions } from "../model/idea-evaluation";

const dimensionKey = (dimension: IdeaDimension) =>
  `mind.dimension.${dimension}` as MessageKey;
const questionKey = (question: string) =>
  `mind.question.${question}` as MessageKey;
const levelKey = (level: NonNullable<Idea["evaluation"]>["level"]) =>
  `mind.level.${level}` as MessageKey;

export function EvaluationSummary({ idea }: { idea: Idea }) {
  const { t } = useI18n();
  const evaluation = idea.evaluation;
  if (!evaluation)
    return <p className="text-xs text-zinc-500">{t("mind.notEvaluated")}</p>;
  const strongest = evaluation.strength as IdeaDimension;
  const weakest = evaluation.weakness as IdeaDimension;
  return (
    <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{t("mind.result")}</span>
        <Badge
          tone={
            evaluation.level === "strong" && !evaluation.gateFailures.length
              ? "success"
              : "warning"
          }
        >
          {evaluation.totalScore} / 100
        </Badge>
      </div>
      <p className="mt-2 text-xs font-medium">
        {t(levelKey(evaluation.level))}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        {dimensions.map((dimension) => (
          <div
            key={dimension}
            className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900"
          >
            <p className="text-zinc-500">{t(dimensionKey(dimension))}</p>
            <p className="mt-1 font-semibold">
              {evaluation.dimensionScores[dimension]}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-1 text-xs text-zinc-600 dark:text-zinc-300">
        <p>
          <strong>{t("mind.strength")}:</strong> {t(dimensionKey(strongest))} (
          {evaluation.dimensionScores[strongest]})
        </p>
        <p>
          <strong>{t("mind.weakness")}:</strong> {t(dimensionKey(weakest))} (
          {evaluation.dimensionScores[weakest]})
        </p>
        <p>
          <strong>{t("mind.nextStep")}:</strong> {t(levelKey(evaluation.level))}
        </p>
      </div>
      {!!evaluation.gateFailures.length && (
        <Alert tone="warning">
          {t("mind.gateBlocked")}{" "}
          {evaluation.gateFailures
            .map((item) => t(dimensionKey(item)))
            .join(" / ")}
        </Alert>
      )}
    </div>
  );
}

export function IdeaEvaluationDialog({
  idea,
  onClose,
  onSave,
}: {
  idea: Idea | null;
  onClose: () => void;
  onSave: (id: string, answers: number[], killCondition: string) => void;
}) {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<number[]>(
    idea?.evaluation?.answers ?? Array(15).fill(0),
  );
  const [killCondition, setKillCondition] = useState(
    idea?.evaluation?.killCondition ?? "",
  );
  const complete =
    answers.every((answer) => answer >= 1 && answer <= 5) &&
    !!killCondition.trim();
  let questionIndex = 0;

  return (
    <Dialog
      open={!!idea}
      title={t("mind.evaluation")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <p className="mb-5 text-sm text-zinc-500">{t("mind.evaluationHint")}</p>
      <div className="space-y-6">
        {dimensions.map((dimension) => (
          <section key={dimension}>
            <h3 className="mb-3 font-semibold">{t(dimensionKey(dimension))}</h3>
            <div className="space-y-4">
              {evaluationQuestions[dimension].map((question) => {
                const index = questionIndex++;
                return (
                  <fieldset
                    key={question}
                    className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900"
                  >
                    <legend className="text-sm leading-6">
                      {index + 1}. {t(questionKey(question))}
                    </legend>
                    <div className="mt-2 grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <label
                          key={score}
                          className="cursor-pointer text-center text-xs text-zinc-500"
                        >
                          <input
                            className="mb-1 block w-full"
                            type="radio"
                            name={`question-${index}`}
                            value={score}
                            checked={answers[index] === score}
                            onChange={() =>
                              setAnswers((current) =>
                                current.map((answer, answerIndex) =>
                                  answerIndex === index ? score : answer,
                                ),
                              )
                            }
                          />
                          {t(`mind.likert.${score}` as MessageKey)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </section>
        ))}
        <Field label={t("mind.killCondition")}>
          <Textarea
            value={killCondition}
            onChange={(event) => setKillCondition(event.target.value)}
            required
          />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          disabled={!complete}
          onClick={() => {
            if (idea) onSave(idea.id, answers, killCondition);
          }}
        >
          {t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}
