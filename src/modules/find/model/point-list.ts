import type { PointList, ReferencePoint } from "@/shared/model/entities";

export const defaultPointColor = "#f59e0b";

export function pointTraceColor(
  point: Pick<ReferencePoint, "listIds">,
  lists: Pick<PointList, "id" | "color">[],
) {
  return (
    lists.find((list) => list.id === point.listIds[0])?.color ??
    defaultPointColor
  );
}
