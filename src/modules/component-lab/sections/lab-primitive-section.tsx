"use client";

import { useState } from "react";
import {
  CheckIcon,
  InformationCircleIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  DescriptionList,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  LoadingState,
  ProgressBar,
  Select,
  Switch,
  Tabs,
  Textarea,
} from "@/shared/components";

export function LabPrimitiveSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checked, setChecked] = useState(true);
  const [switched, setSwitched] = useState(true);
  const [tab, setTab] = useState("one");
  const [select, setSelect] = useState("default");
  return (
    <section className="space-y-4" id="components">
      <SectionTitle title="Component / button / text" description="Foundation controls and visual states." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Buttons</h3>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <IconButton label="Add" size="xs"><PlusIcon className="size-4" /></IconButton>
            <IconButton label="Remove" size="sm"><MinusIcon className="size-4" /></IconButton>
            <IconButton label="Close"><XMarkIcon className="size-5" /></IconButton>
            <IconButton label="Delete" tone="danger"><XMarkIcon className="size-5" /></IconButton>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Text styles</h3>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Eyebrow / metadata</p>
            <h1 className="text-3xl font-semibold tracking-tight">Heading level one</h1>
            <h2 className="text-xl font-semibold">Heading level two</h2>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">Body text with a comfortable reading measure and muted secondary color.</p>
            <p className="font-mono text-xs text-zinc-500">code · tabular-nums · monospace</p>
            <blockquote className="border-l-2 border-zinc-300 pl-4 text-sm italic text-zinc-500">A compact quote style for supporting context.</blockquote>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Form controls</h3>
          <div className="grid gap-4">
            <Field label="Input"><Input placeholder="Placeholder text" /></Field>
            <Field label="Textarea"><Textarea placeholder="Long-form input" className="min-h-20" /></Field>
            <Field label="Select">
              <Select value={select} onChange={(event) => setSelect(event.target.value)}>
                <option value="default">Default option</option>
                <option value="alternative">Alternative option</option>
              </Select>
            </Field>
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <label className="flex items-center gap-2"><Switch checked={switched} onChange={setSwitched} /> Switch</label>
              <label className="flex items-center gap-2"><Checkbox checked={checked} onChange={setChecked} aria-label="Checkbox" /> Checkbox</label>
              <span className="text-zinc-500">{checked ? "checked" : "unchecked"} · {switched ? "on" : "off"}</span>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Feedback and data</h3>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="warning">Warning</Badge>
              <Badge tone="danger">Danger</Badge>
              <Badge variant="solid">Solid</Badge>
            </div>
            <Alert><span className="flex items-center gap-2"><InformationCircleIcon className="size-4" />Informational alert</span></Alert>
            <Alert tone="success">Success alert</Alert>
            <Alert tone="warning">Warning alert</Alert>
            <Alert tone="danger">Danger alert</Alert>
            <ProgressBar value={68} label="Progress" />
            <DescriptionList items={[{ label: "Owner", value: "Local user" }, { label: "Status", value: <Badge tone="success">Ready</Badge> }]} divided />
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Navigation and overlays</h3>
          <div className="grid gap-4">
            <Tabs value={tab} onChange={setTab} items={[{ value: "one", label: "Overview" }, { value: "two", label: "Details" }, { value: "three", label: "History" }]} />
            <p className="text-sm text-zinc-500">Active tab: {tab}</p>
            <div className="flex gap-2"><Button onClick={() => setDialogOpen(true)}>Open Dialog</Button><Button variant="ghost">Tab action</Button></div>
            <div className="h-20 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"><LoadingState label="LoadingState" className="h-20" /></div>
            <EmptyState title="EmptyState" description="No records in this sample." action={<Button variant="secondary">Create sample</Button>} />
          </div>
        </Card>
      </div>
      <Dialog open={dialogOpen} title="Dialog component" closeLabel="Close" onClose={() => setDialogOpen(false)}>
        <div className="space-y-4"><p className="text-sm text-zinc-500">The overlay, close button, focus styling, and dark mode are all production components.</p><Button onClick={() => setDialogOpen(false)}><CheckIcon className="size-4" />Done</Button></div>
      </Dialog>
    </section>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-zinc-500">{description}</p></div>;
}

