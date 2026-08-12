import type { IdeaDimension, IdeaEvaluation } from "@/shared/model/entities";

export const dimensions: IdeaDimension[] = [
  "value",
  "relevance",
  "feasibility",
  "testability",
  "opportunity",
];

export const evaluationQuestions: Record<IdeaDimension, string[]> = {
  value: ["value1", "value2", "value3"],
  relevance: ["relevance1", "relevance2", "relevance3"],
  feasibility: ["feasibility1", "feasibility2", "feasibility3"],
  testability: ["testability1", "testability2", "testability3"],
  opportunity: ["opportunity1", "opportunity2", "opportunity3"],
};

const percent = (raw: number, minimum: number, range: number) =>
  Math.round(((raw - minimum) / range) * 100);

export function evaluateIdea(
  answers: number[],
  killCondition: string,
  evaluatedAt = new Date().toISOString(),
): IdeaEvaluation {
  if (
    answers.length !== 15 ||
    answers.some((answer) => answer < 1 || answer > 5)
  )
    throw new Error("All 15 answers must use a score from 1 to 5.");
  if (!killCondition.trim()) throw new Error("Kill condition is required.");

  const dimensionScores = Object.fromEntries(
    dimensions.map((dimension, index) => {
      const raw = answers
        .slice(index * 3, index * 3 + 3)
        .reduce((sum, score) => sum + score, 0);
      return [dimension, percent(raw, 3, 12)];
    }),
  ) as Record<IdeaDimension, number>;
  const raw = answers.reduce((sum, score) => sum + score, 0);
  const totalScore = percent(raw, 15, 60);
  const level =
    totalScore >= 80
      ? "strong"
      : totalScore >= 65
        ? "promising"
        : totalScore >= 50
          ? "uncertain"
          : totalScore >= 35
            ? "weak"
            : "poor";
  const gateFailures = (
    ["value", "feasibility", "testability"] as IdeaDimension[]
  ).filter((dimension) => dimensionScores[dimension] < 40);
  const strongest = dimensions.reduce((best, item) =>
    dimensionScores[item] > dimensionScores[best] ? item : best,
  );
  const weakest = dimensions.reduce((worst, item) =>
    dimensionScores[item] < dimensionScores[worst] ? item : worst,
  );

  return {
    answers,
    killCondition: killCondition.trim(),
    totalScore,
    dimensionScores,
    level,
    gateFailures,
    strength: strongest,
    weakness: weakest,
    nextStep:
      level === "strong" && !gateFailures.length
        ? "promote"
        : level === "weak"
          ? "park"
          : level === "poor"
            ? "reject"
            : "validate",
    evaluatedAt,
  };
}

export const canPromoteIdea = (evaluation?: IdeaEvaluation) =>
  !!evaluation &&
  evaluation.totalScore >= 80 &&
  evaluation.gateFailures.length === 0;
