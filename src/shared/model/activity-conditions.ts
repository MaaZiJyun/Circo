import type { ActivityCondition } from "./entities";

export type ActivityConditionDraft = {
  id: string;
  condition: string;
  satisfiedAt?: string;
};

export function activityConditionsFor(
  conditions: ActivityCondition[],
  activityId: string,
) {
  return conditions.filter((item) => item.activityId === activityId);
}

export function replaceActivityConditions(
  conditions: ActivityCondition[],
  activityId: string,
  drafts: ActivityConditionDraft[],
) {
  return [
    ...conditions.filter((item) => item.activityId !== activityId),
    ...drafts
      .map((item) => ({
        id: item.id,
        activityId,
        condition: item.condition.trim(),
        ...(item.satisfiedAt ? { satisfiedAt: item.satisfiedAt } : {}),
      }))
      .filter((item) => item.condition),
  ];
}

export function setActivityConditionSatisfied(
  conditions: ActivityCondition[],
  id: string,
  satisfied: boolean,
  stamp: string,
) {
  return conditions.map((item) =>
    item.id === id
      ? { ...item, satisfiedAt: satisfied ? stamp : undefined }
      : item,
  );
}
