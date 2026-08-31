"use client";

import { useState } from "react";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { Button, PageHeader } from "@/shared/components";
import { LabLayoutSection } from "../sections/lab-layout-section";
import { LabNavigationWidgetsSection } from "../sections/lab-navigation-widgets-section";
import { LabPrimitiveSection } from "../sections/lab-primitive-section";
import { LabDataWidgetsSection } from "../sections/lab-data-widgets-section";
import { LabFormWidgetsSection } from "../sections/lab-form-widgets-section";

export function ComponentLabView() {
  const [resetKey, setResetKey] = useState(0);
  return (
    <main className="h-dvh overflow-y-auto overscroll-contain bg-white px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          eyebrow="Internal component lab"
          title="Component & widget styles"
          subtitle="Direct-route visual sandbox for maintaining reusable UI. Changes here are isolated from the application shell."
          actions={
            <Button variant="secondary" onClick={() => setResetKey((key) => key + 1)}>
              <BeakerIcon className="size-4" />
              Reset samples
            </Button>
          }
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          This page is intentionally absent from navigation and search. Open it by entering its route directly.
        </div>
        <LabPrimitiveSection key={`primitive-${resetKey}`} />
        <LabFormWidgetsSection key={`form-${resetKey}`} />
        <LabLayoutSection key={`layout-${resetKey}`} />
        <LabDataWidgetsSection key={`data-${resetKey}`} />
        <LabNavigationWidgetsSection key={`navigation-${resetKey}`} />
      </div>
    </main>
  );
}
