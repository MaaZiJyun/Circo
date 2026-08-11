export const literatureDragType = "application/x-circo-literature-ids";

export function readDraggedLiterature(event: React.DragEvent) {
  try {
    const value: unknown = JSON.parse(
      event.dataTransfer.getData(literatureDragType),
    );
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
