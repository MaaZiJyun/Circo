"use client";

import { useState } from "react";
import { buildDailySummaryMessage } from "@/modules/dashboard/model/daily-summary-message";
import { Button, Dialog, Field, Textarea } from "@/shared/components/ui";
import { clearDailyCacheDate } from "@/shared/model/daily-cache";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import { now, today } from "@/shared/model/factories";
import type { DailyReviewAnswers } from "@/shared/model/message";
import { useStore } from "@/shared/view-models/store-context";

const questions: Array<{
  key: keyof DailyReviewAnswers;
  question: MessageKey;
  hint: MessageKey;
}> = [
  {
    key: "accomplished",
    question: "dashboard.finishToday.question.accomplished",
    hint: "dashboard.finishToday.hint.accomplished",
  },
  {
    key: "learned",
    question: "dashboard.finishToday.question.learned",
    hint: "dashboard.finishToday.hint.learned",
  },
  {
    key: "wentWrong",
    question: "dashboard.finishToday.question.wentWrong",
    hint: "dashboard.finishToday.hint.wentWrong",
  },
  {
    key: "unfinished",
    question: "dashboard.finishToday.question.unfinished",
    hint: "dashboard.finishToday.hint.unfinished",
  },
  {
    key: "changeNextTime",
    question: "dashboard.finishToday.question.changeNextTime",
    hint: "dashboard.finishToday.hint.changeNextTime",
  },
  {
    key: "tomorrowPriority",
    question: "dashboard.finishToday.question.tomorrowPriority",
    hint: "dashboard.finishToday.hint.tomorrowPriority",
  },
];

const emptyAnswers = (): DailyReviewAnswers => ({
  accomplished: "",
  learned: "",
  wentWrong: "",
  unfinished: "",
  changeNextTime: "",
  tomorrowPriority: "",
});

export function FinishTodayDialog({
  onClose,
  onFinished,
}: {
  onClose: () => void;
  onFinished: (score: number) => void;
}) {
  const { t, formatNumber } = useI18n();
  const { state, mutate } = useStore();
  const [answers, setAnswers] = useState(emptyAnswers);
  const complete = questions.every(({ key }) => answers[key].trim());
  const submit = () => {
    if (!state || !complete) return;
    const stamp = now();
    const review = questions.reduce(
      (current, { key }) => ({
        ...current,
        [key]: answers[key].trim(),
      }),
      emptyAnswers(),
    );
    const { message, result } = buildDailySummaryMessage({
      dailyTasks: state.dailyTasks,
      date: today(),
      stamp,
      deliverAt: stamp,
      review,
      t,
      formatNumber,
    });
    mutate((current) =>
      current.messages.some((item) => item.id === message.id)
        ? current
        : {
            ...clearDailyCacheDate(current, today()),
            messages: [...current.messages, message],
          },
    );
    window.dispatchEvent(new Event("circo-message-delivered"));
    onFinished(result.score);
  };
  return (
    <Dialog
      open
      title={t("dashboard.startReview")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <p className="mb-5 text-sm leading-6 text-zinc-500">
        {t("dashboard.finishTodayIntro")}
      </p>
      <div className="grid gap-5">
        {questions.map(({ key, question, hint }, index) => (
          <Field
            key={key}
            label={`${index + 1}. ${t(question)}`}
            hint={t(hint)}
          >
            <Textarea
              className="min-h-24"
              value={answers[key]}
              onChange={(event) =>
                setAnswers({ ...answers, [key]: event.target.value })
              }
            />
          </Field>
        ))}
        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!complete} onClick={submit}>
            {t("dashboard.finishTodaySubmit")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
