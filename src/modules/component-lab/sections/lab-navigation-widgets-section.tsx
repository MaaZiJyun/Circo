"use client";

import { useState } from "react";
import { FolderIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  AppSearchResults,
  Button,
  Card,
  ChooseListDialog,
  ColorPalette,
  Input,
  LibrarySortControls,
  ListFormDialog,
  ListSidebar,
  ProfileAvatar,
  SidebarProfile,
} from "@/shared/components";

const demoLists = [
  { id: "all", name: "All items", color: "#2563eb", system: "default" },
  { id: "focus", name: "Focus list", color: "#16a34a", system: null },
  { id: "later", name: "Later", color: "#9333ea", system: null },
];

export function LabNavigationWidgetsSection() {
  const [activeList, setActiveList] = useState("all");
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [color, setColor] = useState("#60a5fa");
  const [sort, setSort] = useState("name:ascending");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<"form" | "choose" | null>(null);
  return (
    <section className="space-y-4" id="navigation-widgets">
      <div><h2 className="text-xl font-semibold">Navigation and collection widgets</h2><p className="mt-1 text-sm text-zinc-500">List, search, avatar, sorting, and color selection patterns.</p></div>
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <ListSidebar
          title="ListSidebar"
          createLabel="Create list"
          editLabel="Edit list"
          deleteLabel="Delete list"
          confirmDeleteLabel="Delete this sample list?"
          lists={demoLists}
          activeId={activeList}
          onSelect={setActiveList}
          onCreate={() => setDialog("form")}
          onEdit={() => setDialog("form")}
          onDelete={() => undefined}
          getLabel={(list) => list.name}
          getCount={(list) => list.id === "all" ? 12 : 4}
          getIcon={() => <FolderIcon className="size-4" />}
          onDrop={(ids, listId) => { setDraggedIds(ids); setActiveList(listId); }}
          draggedIds={draggedIds}
          setDraggedIds={setDraggedIds}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-semibold">LibrarySortControls</h3>
            <LibrarySortControls label="Sort" value={sort} options={[{ value: "name:ascending", label: "Sort by name · ascending" }, { value: "name:descending", label: "Sort by name · descending" }, { value: "date:ascending", label: "Sort by date · ascending" }, { value: "date:descending", label: "Sort by date · descending" }]} onChange={setSort} />
            <div className="mt-5 flex items-center gap-3"><ColorPalette value={color} onChange={setColor} /><span className="text-xs text-zinc-500">{color}</span></div>
          </Card>
          <Card>
            <h3 className="mb-4 font-semibold">ProfileAvatar / SidebarProfile</h3>
            <div className="flex items-center gap-4"><ProfileAvatar name="Demo user" src="" large /><ProfileAvatar name="Demo user" src="" /><SidebarProfile active="dashboard" onNavigate={() => undefined} /></div>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="mb-4 font-semibold">AppSearchResults</h3>
            <div className="relative max-w-xl"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type at least two characters" /><AppSearchResults query={query} onNavigate={() => setQuery("")} /></div>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="mb-4 font-semibold">List dialogs</h3>
            <div className="flex flex-wrap gap-2"><Button onClick={() => setDialog("form")}><PlusIcon className="size-4" />ListFormDialog</Button><Button variant="secondary" onClick={() => setDialog("choose")}>ChooseListDialog</Button></div>
          </Card>
        </div>
      </div>
      {dialog === "form" && <ListFormDialog title="ListFormDialog" nameLabel="Name" noteLabel="Note" colorLabel="Color" onClose={() => setDialog(null)} onSave={() => setDialog(null)} />}
      {dialog === "choose" && <ChooseListDialog title="ChooseListDialog" emptyLabel="No lists" lists={demoLists} onClose={() => setDialog(null)} onChoose={() => setDialog(null)} />}
    </section>
  );
}
