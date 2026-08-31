import type { ProjectLog } from "@/shared/model/entities";

export function projectLogTitle(log: Pick<ProjectLog, "content" | "createdAt">) {
  const lines = log.content.split(/\r?\n/);
  const heading = lines.find((line) => /^#{1,6}\s+\S/.test(line.trim()));
  if (heading) return heading.trim().replace(/^#{1,6}\s+/, "");
  const text = lines.find((line) => line.trim() && !/^\$\$/.test(line.trim()));
  return text?.trim().replace(/^[-*>]\s*/, "").slice(0, 100) ||
    log.createdAt.slice(0, 10);
}
