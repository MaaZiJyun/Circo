import { describe, expect, it } from "vitest";
import type { DailyTask } from "@/shared/model/entities";
import {
  taskCoordinatesFromFormula,
  taskFormulaContext,
  validateTaskCoordinateFormulas,
} from "./task-coordinate-formula";

const currentTime = Date.parse("2026-08-14T08:00:00.000Z");
const task = {
  date: "2026-08-14",
  completed: false,
  dueAt: "2026-08-14T09:00:00.000Z",
  estimatedMinutes: 60,
  actualMinutes: 20,
  impact: 4,
  goal: 4,
  risk: 4,
  value: 4,
  importance: 16,
  createdAt: "2026-08-14T07:30:00.000Z",
  updatedAt: "2026-08-14T07:45:00.000Z",
} as DailyTask;

describe("task coordinate formulas", () => {
  it("uses the three-part urgency and stored importance as defaults", () => {
    expect(taskCoordinatesFromFormula(task, undefined, currentTime)).toEqual({
      urgency: 46,
      importance: 75,
      priority: 7.11,
      effort: 18,
      quadrant: "schedule",
    });
  });

  it("uses exact DailyTask database field names", () => {
    const context = taskFormulaContext(task, currentTime);
    expect(context.dueAt).toBe(Date.parse(task.dueAt));
    expect(context.createdAt).toBe(Date.parse(task.createdAt));
    expect(context.completed).toBe(0);
    const result = taskCoordinatesFromFormula(
      task,
      {
        urgency: "actualMinutes * 2",
        importance: "estimatedMinutes",
        x: "urgency",
        y: "importance",
        size: "48",
      },
      currentTime,
    );
    expect(result).toEqual({
      urgency: 40,
      importance: 60,
      priority: 7.11,
      effort: 18,
      quadrant: "schedule",
    });
  });

  it("rejects field names that do not exist on DailyTask", () => {
    expect(() =>
      validateTaskCoordinateFormulas({
        urgency: "dueDate - currentTime",
        importance: "importance",
        x: "urgency",
        y: "importance",
        size: "48",
      }),
    ).toThrow("Unknown variable: dueDate");
  });
});
