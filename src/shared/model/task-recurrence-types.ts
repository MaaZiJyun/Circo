export interface TaskRecurrence {
  interval: number;
  unit: "day" | "week" | "month" | "year";
}
