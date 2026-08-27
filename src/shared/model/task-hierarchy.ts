import type { ActivityRecord } from "./entities";

export function setTaskParents(
  activities: ActivityRecord[],
  ids: string[],
  parentId: string | null,
  updatedAt: string,
) {
  const selected = new Set(ids);
  const candidate = activities.map((item) =>
    selected.has(item.id) && item.id !== parentId
      ? { ...item, parentId: parentId ?? undefined, updatedAt }
      : item,
  );
  const byId = new Map(candidate.map((item) => [item.id, item]));
  return candidate.map((item) =>
    selected.has(item.id) && parentId && createsCycle(item.id, parentId, byId)
      ? { ...item, parentId: undefined }
      : item,
  );
}

function createsCycle(
  childId: string,
  parentId: string,
  activities: Map<string, ActivityRecord>,
) {
  let current: string | undefined = parentId;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    if (current === childId) return true;
    visited.add(current);
    current = activities.get(current)?.parentId;
  }
  return false;
}
