import type { ProjectRecord } from "@/shared/model/entities";
import type { ProjectInput } from "../view-models/use-hand-view-model";

export const projectInputFromRecord = (
  project: ProjectRecord,
): ProjectInput => ({
  name: project.name,
  purpose: project.purpose,
  expected: project.expected,
  startDate: project.startDate,
  endDate: project.endDate,
  tags: project.tags,
  score: project.score,
});
