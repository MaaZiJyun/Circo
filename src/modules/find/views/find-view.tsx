"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/shared/components/page-elements";
import { Button, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { SourceRecord } from "@/shared/model/entities";
import { useFindViewModel } from "../view-models/use-find-view-model";
import { useLibraryManagement } from "../view-models/use-library-management";
import { ImportDialog } from "./find-dialogs";
import { CreateListDialog, EditLiteratureDialog } from "./library-dialogs";
import { LibrarySidebar } from "./library-sidebar";
import { LiteratureTable } from "./literature-table";

export function FindView() {
  const { t } = useI18n();
  const find = useFindViewModel();
  const library = useLibraryManagement();
  const [dialog, setDialog] = useState<"import" | "list" | null>(null);
  const [editing, setEditing] = useState<SourceRecord | null>(null);
  const [targetList, setTargetList] = useState("");
  const [operationError, setOperationError] = useState("");
  const customLists = library.lists.filter((item) => !item.system);
  const deleteSelected = async () => {
    if (!window.confirm(t("find.confirmDeleteFiles"))) return;
    setOperationError("");
    try {
      await library.deleteSelected();
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : t("common.error"),
      );
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("find.eyebrow")}
        title={t("find.title")}
        subtitle={t("find.subtitle")}
        actions={
          <Button onClick={() => setDialog("import")}>
            <PlusIcon className="size-4" />
            {t("find.import")}
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <LibrarySidebar library={library} onCreate={() => setDialog("list")} />
        <section className="min-w-0 space-y-3">
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                {library.selectedList?.system
                  ? t(`find.list.${library.selectedList.system}`)
                  : library.selectedList?.name}
              </h2>
              <p className="text-xs text-zinc-500">
                {t("find.literatureCount").replace(
                  "{count}",
                  String(library.sources.length),
                )}
              </p>
            </div>
            {library.selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500">
                  {t("find.selectedCount").replace(
                    "{count}",
                    String(library.selectedIds.length),
                  )}
                </span>
                <Select
                  aria-label={t("find.addToList")}
                  value={targetList}
                  onChange={(event) => {
                    const listId = event.target.value;
                    setTargetList("");
                    library.addToList(library.selectedIds, listId);
                  }}
                  className="w-40"
                >
                  <option value="">{t("find.addToList")}</option>
                  {customLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="secondary"
                  disabled={library.selectedList?.system !== null}
                  onClick={library.removeFromCurrentList}
                >
                  <XMarkIcon className="size-4" />
                  {t("find.removeFromList")}
                </Button>
                <Button variant="danger" onClick={() => void deleteSelected()}>
                  <TrashIcon className="size-4" />
                  {t("common.delete")}
                </Button>
              </div>
            )}
          </div>
          {operationError && (
            <p className="text-sm text-red-600">{operationError}</p>
          )}
          <LiteratureTable library={library} onEdit={setEditing} />
        </section>
      </div>
      <ImportDialog
        open={dialog === "import"}
        onClose={() => setDialog(null)}
        onImport={find.importSource}
      />
      <CreateListDialog
        open={dialog === "list"}
        onClose={() => setDialog(null)}
        onSave={library.createList}
      />
      {editing && (
        <EditLiteratureDialog
          key={editing.id}
          source={editing}
          onClose={() => setEditing(null)}
          onSave={library.updateSource}
        />
      )}
    </div>
  );
}
