import type { Idea } from "@/shared/model/entities";

export type IdeaSort = "dateDesc" | "dateAsc" | "scoreDesc" | "scoreAsc";

export function sortIdeas(ideas: Idea[], sort: IdeaSort) {
  const sorted = ideas.slice();
  if (sort === "dateDesc" || sort === "dateAsc") {
    const direction = sort === "dateDesc" ? -1 : 1;
    return sorted.sort(
      (a, b) =>
        (a.date || a.createdAt).localeCompare(b.date || b.createdAt) *
        direction,
    );
  }
  const direction = sort === "scoreDesc" ? -1 : 1;
  return sorted.sort((a, b) => {
    const aScore = a.evaluation?.totalScore;
    const bScore = b.evaluation?.totalScore;
    if (aScore === undefined) return bScore === undefined ? 0 : 1;
    if (bScore === undefined) return -1;
    return (aScore - bScore) * direction;
  });
}
