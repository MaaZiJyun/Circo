"use client";

import { SectionHeader } from "./page-elements";
import { SelectionToolbar } from "./selection-toolbar";
import { Card } from "./ui";

export function TableLibraryWorkspace({
  title,
  controls,
  action,
  selectionLabel,
  selectionActions,
  onCancelSelection,
  children,
}: {
  title: string;
  controls?: React.ReactNode;
  action?: React.ReactNode;
  selectionLabel?: string;
  selectionActions?: React.ReactNode;
  onCancelSelection?: () => void;
  children: React.ReactNode;
}) {
  const selecting = Boolean(selectionLabel && onCancelSelection);
  return (
    <Card className="flex h-full min-h-0 min-w-0 flex-col">
      <SectionHeader
        title={title}
        controls={!selecting ? controls : undefined}
        action={!selecting ? action : undefined}
      />
      {selecting && onCancelSelection && (
        <SelectionToolbar label={selectionLabel!} onCancel={onCancelSelection}>
          {selectionActions}
        </SelectionToolbar>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  );
}
