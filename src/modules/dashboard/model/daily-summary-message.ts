import type { DailyTask } from "@/shared/model/entities";
import type { MessageKey } from "@/shared/i18n/zh";
import type { DailyReviewAnswers, FutureMessage } from "@/shared/model/message";
import { isOverdue } from "@/shared/model/task-status";
import { calculateDailyScore } from "./daily-score";

type Translate = (key: MessageKey) => string;
type FormatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
) => string;

const reviewFields: Array<{
  key: keyof DailyReviewAnswers;
  label: MessageKey;
}> = [
  {
    key: "accomplished",
    label: "dashboard.finishToday.question.accomplished",
  },
  { key: "learned", label: "dashboard.finishToday.question.learned" },
  { key: "wentWrong", label: "dashboard.finishToday.question.wentWrong" },
  {
    key: "unfinished",
    label: "dashboard.finishToday.question.unfinished",
  },
  {
    key: "changeNextTime",
    label: "dashboard.finishToday.question.changeNextTime",
  },
  {
    key: "tomorrowPriority",
    label: "dashboard.finishToday.question.tomorrowPriority",
  },
];

export const dailySummaryId = (date: string) => `message_daily_summary_${date}`;
export const shouldCelebrateFinishToday = (score: number) => score > 60;

export function buildDailySummaryMessage({
  dailyTasks,
  date,
  stamp,
  deliverAt = `${date}T23:59:00`,
  review,
  t,
  formatNumber,
}: {
  dailyTasks: DailyTask[];
  date: string;
  stamp: string;
  deliverAt?: string;
  review?: DailyReviewAnswers;
  t: Translate;
  formatNumber: FormatNumber;
}) {
  const activities = dailyTasks.filter(
    (task) => task.date === date && !task.deletedAt,
  );
  const result = calculateDailyScore(dailyTasks, date);
  const scoringTime = new Date(`${date}T23:59:59.999`).getTime();
  const taskLines = activities.length
    ? activities.map(
        (task) =>
          `${task.completed ? "✓" : isOverdue(task.dueAt, false, scoringTime) ? "!" : "○"} ${task.title} · ${formatNumber(task.actualMinutes, { maximumFractionDigits: 1 })} ${t("common.minutes")}`,
      )
    : [t("messages.dailySummary.noTasks")];
  const breakdown = t("dashboard.scoreBreakdown")
    .replace("{completed}", String(result.completed))
    .replace("{incomplete}", String(result.incomplete))
    .replace("{overdue}", String(result.overdue))
    .replace(
      "{actual}",
      formatNumber(result.actualMinutes, { maximumFractionDigits: 1 }),
    )
    .replace("{planned}", formatNumber(result.plannedMinutes))
    .replace("{completionScore}", formatNumber(result.completionScore))
    .replace("{timeScore}", formatNumber(result.timeScore))
    .replace("{priorityScore}", formatNumber(result.priorityScore))
    .replace("{overdueDiscount}", formatNumber(result.overdueDiscount));
  const reflectionLines = review
    ? [
        "",
        t("dashboard.finishToday.reflection"),
        ...reviewFields.flatMap(({ key, label }, index) => [
          `${index + 1}. ${t(label)}`,
          review[key],
        ]),
      ]
    : [];
  const message: FutureMessage = {
    id: dailySummaryId(date),
    subject: t("messages.dailySummary.subject").replace("{date}", date),
    body: [
      t("messages.dailySummary.intro").replace("{date}", date),
      "",
      t("messages.dailySummary.activities"),
      ...taskLines,
      ...reflectionLines,
      "",
      `score: ${result.score} / 100`,
      t("dashboard.scoreFormula"),
      breakdown,
      t(`dashboard.scoreReason.${result.reason}`),
    ].join("\n"),
    recipient: "futureSelf",
    deliveryMode: "scheduled",
    deliverAt,
    references: activities.flatMap((task) =>
      task.sourceTaskId
        ? [{ kind: "task" as const, id: task.sourceTaskId, label: task.title }]
        : [],
    ),
    attachments: [],
    systemGenerated: true,
    messageType: "dailySummary",
    dailyReview: review,
    createdAt: stamp,
    updatedAt: stamp,
  };
  return { message, result };
}
