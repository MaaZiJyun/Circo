"use client";

import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  PageHeader,
  SectionHeader,
  SelectionToolbar,
  StatCard,
  TableLibraryWorkspace,
} from "@/shared/components";

export function LabLayoutSection() {
  return (
    <section className="space-y-4" id="sections">
      <div><h2 className="text-xl font-semibold">Section</h2><p className="mt-1 text-sm text-zinc-500">Page-level and workspace composition patterns.</p></div>
      <Card>
        <PageHeader eyebrow="Section eyebrow" title="PageHeader" subtitle="A page header keeps title hierarchy and actions aligned." actions={<Button><PlusIcon className="size-4" />Action</Button>} />
        <div className="mt-8 space-y-5">
          <SectionHeader title="SectionHeader" controls={<Button variant="ghost">Control</Button>} action={<Button variant="secondary"><CalendarDaysIcon className="size-4" />Action</Button>} />
          <div className="grid gap-4 md:grid-cols-3"><StatCard label="StatCard" value="128" hint="Reusable metric surface" /><StatCard label="Another metric" value="68%" /><StatCard label="Neutral metric" value="24h" /></div>
          <SelectionToolbar label="2 selected" onCancel={() => undefined}><Button variant="secondary">Batch action</Button><Button variant="danger">Delete</Button></SelectionToolbar>
          <TableLibraryWorkspace title="TableLibraryWorkspace" controls={<Button variant="ghost">Sort</Button>} action={<Button>New item</Button>}><div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">Content slot</div></TableLibraryWorkspace>
        </div>
      </Card>
    </section>
  );
}

