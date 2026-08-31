export const now = () => new Date().toISOString();

export const createId = (prefix: string) => {
  const random =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
};

export const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  const month = String(result.getMonth() + 1).padStart(2, "0");
  const day = String(result.getDate()).padStart(2, "0");
  return `${result.getFullYear()}-${month}-${day}`;
};

const minute = 60_000;

/** 解析 "YYYY-MM-DD" 或 "YYYY-MM-DDTHH:mm" 为本地时间戳（与任务日期输入保持一致）。 */
export function parseLocalDateTime(value: string): number {
  const [datePart, timePart = ""] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minutePart = 0] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minutePart).getTime();
}

/** 将时间戳格式化为 "YYYY-MM-DDTHH:mm"（本地时间）。 */
export function formatLocalDateTime(value: number): string {
  const date = new Date(value);
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const timePart = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":");
  return `${datePart}T${timePart}`;
}

/** 由 startDate 与 dueDate 自动推导估算工时（分钟），即 due - start。 */
export function estimateMinutes(startDate: string, dueDate: string): number {
  return Math.max(
    0,
    Math.round((parseLocalDateTime(dueDate) - parseLocalDateTime(startDate)) / minute),
  );
}

/** 由 dueDate 与估算工时反推 startDate（用于迁移旧数据）。 */
export function startDateFromDue(dueDate: string, estimatedMinutes: number): string {
  const due = parseLocalDateTime(dueDate);
  if (!Number.isFinite(due)) return dueDate;
  return formatLocalDateTime(due - Math.max(0, estimatedMinutes) * minute);
}
