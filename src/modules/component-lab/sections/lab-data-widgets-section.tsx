"use client";

import { useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Badge, Button, Card, Checkbox, ContextMenu, ContextMenuItem, DataTable, EmptyState, TaskHierarchyList, TaskRow } from "@/shared/components";
import type { DataTableColumn } from "@/shared/components/data-table";
import type { ActivityRecord } from "@/shared/model/entities";

type DemoRow = { id: string; name: string; status: "ready" | "doing" | "done"; owner: string };
const rows: DemoRow[] = [
  { id: "row-1", name: "Reusable table row", status: "ready", owner: "Local" },
  { id: "row-2", name: "Selected row", status: "doing", owner: "Local" },
  { id: "row-3", name: "Completed row", status: "done", owner: "Local" },
];
const taskBase: ActivityRecord = {
  id: "lab-task-1",
  title: "Expandable task row",
  description: "Click the row to inspect its details.",
  startDate: "2026-01-01T09:00",
  dueDate: "2026-01-02T18:00",
  priority: "medium",
  status: "doing",
  estimatedMinutes: 90,
  actualMinutes: 35,
  milestone: true,
  expectedOutput: "A visible widget sample",
  importance: 60,
  impact: 3,
  goal: 3,
  risk: 2,
  value: 3,
  delayLoss: 2,
  dependencyIds: [],
  complexity: 2,
  uncertainty: 2,
  recurrence: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export function LabDataWidgetsSection() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["row-2"]);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [task, setTask] = useState(taskBase);
  const columns: DataTableColumn<DemoRow>[] = [
    { header: "Name", render: (item) => <span className="font-medium">{item.name}</span> },
    { header: "Status", render: (item) => <Badge tone={item.status === "done" ? "success" : item.status === "doing" ? "info" : "neutral"}>{item.status}</Badge> },
    { header: "Owner", render: (item) => <span className="text-zinc-500">{item.owner}</span> },
  ];
  return (
    <section className="space-y-4" id="data-widgets">
      <div><h2 className="text-xl font-semibold">Data and task widgets</h2><p className="mt-1 text-sm text-zinc-500">Reusable widgets with selection, context-menu, hierarchy, and state behavior.</p></div>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="min-w-0">
          <h3 className="mb-4 font-semibold">DataTable&lt;T&gt;</h3>
          <DataTable
            rows={rows}
            columns={columns}
            selectionMode
            selectedIds={selectedIds}
            selectAllLabel="Select all rows"
            getRowLabel={(item) => item.name}
            onSelectAll={setSelectedIds}
            onToggleSelect={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])}
            onEnterSelection={(item) => setSelectedIds([item.id])}
            onClick={() => undefined}
            onOpenMenu={(item, position) => { void item; setMenu(position); }}
            stickyHeader
            minWidth="min-w-[520px]"
            emptyLabel="No rows"
          />
          <p className="mt-3 text-xs text-zinc-500">Right-click a row to inspect ContextMenu behavior.</p>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">ContextMenu</h3>
          <Button variant="secondary" onClick={() => setMenu({ x: 120, y: 120 })}><EllipsisHorizontalIcon className="size-4" />Open sample menu</Button>
          {menu && <ContextMenu position={menu} onClose={() => setMenu(null)}><ContextMenuItem onClick={() => setMenu(null)}>Edit sample</ContextMenuItem><ContextMenuItem danger onClick={() => setMenu(null)}>Delete sample</ContextMenuItem></ContextMenu>}
          <div className="mt-5"><EmptyState title="Empty widget" description="Use this state for empty collection views." /></div>
        </Card>
        <Card className="xl:col-span-2">
          <h3 className="mb-4 font-semibold">TaskRow / TaskHierarchyList</h3>
          <TaskHierarchyList activities={[task]} onSetParent={() => undefined} renderTask={(item) => <TaskRow title={item.title} description={item.description} status={item.status} dueAt={item.dueDate} estimatedMinutes={item.estimatedMinutes} actualMinutes={item.actualMinutes} expectedOutput={item.expectedOutput} milestone={item.milestone} onToggle={() => setTask((current) => ({ ...current, status: current.status === "done" ? "todo" : "done" }))} />} />
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500"><Checkbox checked={task.status === "done"} onChange={() => setTask((current) => ({ ...current, status: current.status === "done" ? "todo" : "done" }))} aria-label="Toggle task sample" /> Task state: {task.status}</div>
        </Card>
      </div>
    </section>
  );
}

