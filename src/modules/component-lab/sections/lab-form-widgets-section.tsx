"use client";

import { useState } from "react";
import {
  Card,
  TaskEffortFields,
  TaskImportanceFields,
  TaskRecurrenceFields,
  TaskUrgencyFields,
} from "@/shared/components";
import type { TaskRecurrence } from "@/shared/model/entities";

export function LabFormWidgetsSection() {
  const [importance, setImportance] = useState({ impact: 4, goal: 4, risk: 2, value: 4 });
  const [urgency, setUrgency] = useState({ delayLoss: 3, dependencyIds: [] as string[] });
  const [effort, setEffort] = useState({ complexity: 3, uncertainty: 2 });
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>({ interval: 1, unit: "week" });
  return (
    <section className="space-y-4" id="form-widgets">
      <div><h2 className="text-xl font-semibold">Task form widgets</h2><p className="mt-1 text-sm text-zinc-500">The shared task scoring and recurrence field groups.</p></div>
      <Card>
        <div className="grid gap-4 xl:grid-cols-2">
          <TaskImportanceFields value={importance} onChange={setImportance} />
          <TaskUrgencyFields deadline="2026-01-02T18:00" delayLoss={urgency.delayLoss} dependencyIds={urgency.dependencyIds} onChange={setUrgency} />
          <TaskEffortFields estimatedMinutes={90} complexity={effort.complexity} uncertainty={effort.uncertainty} onChange={setEffort} />
          <TaskRecurrenceFields value={recurrence} onChange={setRecurrence} />
        </div>
      </Card>
    </section>
  );
}

