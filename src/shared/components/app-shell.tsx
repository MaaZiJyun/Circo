"use client";

import { useMemo, useState } from "react";
import {
  AcademicCapIcon,
  Bars3Icon,
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HandRaisedIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { DashboardView } from "@/modules/dashboard/views/dashboard-view";
import { FindView } from "@/modules/find/views/find-view";
import { HandView } from "@/modules/hand/views/hand-view";
import { LandView } from "@/modules/land/views/land-view";
import { MeView } from "@/modules/me/views/me-view";
import { MindView } from "@/modules/mind/views/mind-view";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import { activeItems } from "@/shared/model/app-state";
import { useStore } from "@/shared/view-models/store-context";
import { SettingsView } from "./settings-view";
import { IconButton, Input, LoadingState } from "./ui";

export type AppSection =
  "dashboard" | "me" | "find" | "mind" | "hand" | "land" | "settings";

const navigation: {
  id: AppSection;
  label: MessageKey;
  icon: typeof HomeIcon;
}[] = [
  { id: "dashboard", label: "nav.dashboard", icon: HomeIcon },
  { id: "me", label: "nav.me", icon: ChartBarIcon },
  { id: "find", label: "nav.find", icon: AcademicCapIcon },
  { id: "mind", label: "nav.mind", icon: BoltIcon },
  { id: "hand", label: "nav.hand", icon: HandRaisedIcon },
  { id: "land", label: "nav.land", icon: MapPinIcon },
];

function Navigation({
  section,
  setSection,
  close,
}: {
  section: AppSection;
  setSection: (section: AppSection) => void;
  close?: () => void;
}) {
  const { t } = useI18n();
  return (
    <nav className="grid gap-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.id === section;
        return (
          <button
            key={item.id}
            onClick={() => {
              setSection(item.id);
              close?.();
            }}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${active ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"}`}
          >
            <Icon className="size-5" aria-hidden="true" />
            {t(item.label)}
          </button>
        );
      })}
    </nav>
  );
}

function Sidebar({
  section,
  setSection,
}: {
  section: AppSection;
  setSection: (section: AppSection) => void;
}) {
  const { t } = useI18n();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-black lg:flex lg:flex-col">
      <div className="mb-10 flex items-center gap-3 px-2">
        <span className="grid size-9 place-items-center rounded-xl text-zinc-950 text-white dark:text-zinc-50">
          <BeakerIcon className="size-8" />
        </span>
        <div>
          <p className="font-semibold tracking-tight">{t("app.name")}</p>
          <p className="text-xs text-zinc-500">{t("common.localOnly")}</p>
        </div>
      </div>
      <Navigation section={section} setSection={setSection} />
      <button
        onClick={() => setSection("settings")}
        className={`mt-auto flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${section === "settings" ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
      >
        <Cog6ToothIcon className="size-5" />
        {t("nav.settings")}
      </button>
    </aside>
  );
}

function SearchResults({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: (section: AppSection) => void;
}) {
  const { t } = useI18n();
  const { state } = useStore();
  const results = useMemo(() => {
    if (!state || query.trim().length < 2) return [];
    const needle = query.toLowerCase();
    const groups = [
      {
        section: "me" as const,
        items: activeItems(state.goals),
        text: (item: { title: string; unit: string }) =>
          `${item.title} ${item.unit}`,
      },
      {
        section: "find" as const,
        items: activeItems(state.sources),
        text: (item: { title: string; content: string; tags: string[] }) =>
          `${item.title} ${item.content} ${item.tags.join(" ")}`,
      },
      {
        section: "mind" as const,
        items: activeItems(state.ideas),
        text: (item: { title: string; content: string; tags: string[] }) =>
          `${item.title} ${item.content} ${item.tags.join(" ")}`,
      },
      {
        section: "hand" as const,
        items: activeItems(state.projects),
        text: (item: { name: string; purpose: string; tags: string[] }) =>
          `${item.name} ${item.purpose} ${item.tags.join(" ")}`,
      },
      {
        section: "land" as const,
        items: activeItems(state.artifacts),
        text: (item: { title: string; content: string; tags: string[] }) =>
          `${item.title} ${item.content} ${item.tags.join(" ")}`,
      },
    ];
    return groups
      .flatMap((group) =>
        group.items
          .filter((item) =>
            group
              .text(item as never)
              .toLowerCase()
              .includes(needle),
          )
          .map((item) => ({
            id: item.id,
            title:
              "title" in item
                ? String(item.title)
                : String((item as { name: string }).name),
            section: group.section,
          })),
      )
      .slice(0, 8);
  }, [state, query]);
  if (query.trim().length < 2) return null;
  return (
    <div className="absolute left-0 right-0 top-12 z-30 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      {results.length ? (
        results.map((result) => (
          <button
            key={result.id}
            onClick={() => onNavigate(result.section)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <span>{result.title}</span>
            <span className="text-xs text-zinc-500">
              {t(`nav.${result.section}` as MessageKey)}
            </span>
          </button>
        ))
      ) : (
        <p className="p-3 text-sm text-zinc-500">
          {t("dashboard.searchEmpty")}
        </p>
      )}
    </div>
  );
}

export function AppShell() {
  const { t } = useI18n();
  const { state, status, error, reload } = useStore();
  const [section, setSection] = useState<AppSection>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  if (!state && !error) return <LoadingState label={t("common.loading")} />;
  if (!state)
    return (
      <main className="grid h-dvh place-items-center overflow-y-auto p-6">
        <div className="text-center">
          <p className="font-semibold">{t("common.error")}</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button className="mt-4 underline" onClick={() => void reload()}>
            {t("common.retry")}
          </button>
        </div>
      </main>
    );
  const views: Record<AppSection, React.ReactNode> = {
    dashboard: <DashboardView navigate={setSection} />,
    me: <MeView />,
    find: <FindView />,
    mind: <MindView />,
    hand: <HandView />,
    land: <LandView />,
    settings: <SettingsView />,
  };
  return (
    <div className="flex h-dvh overflow-hidden bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Sidebar section={section} setSection={setSection} />
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          onMouseDown={() => setMenuOpen(false)}
        >
          <aside
            className="h-full w-72 bg-white p-5 dark:bg-zinc-950"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">{t("app.name")}</span>
              <IconButton
                label={t("common.close")}
                onClick={() => setMenuOpen(false)}
              >
                <XMarkIcon className="size-5" />
              </IconButton>
            </div>
            <Navigation
              section={section}
              setSection={setSection}
              close={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:px-7">
          <IconButton
            label={t("common.actions")}
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <Bars3Icon className="size-5" />
          </IconButton>
          <div className="relative mx-auto w-full max-w-xl">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 size-5 text-zinc-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("common.search")}
              className="pl-10"
            />
            <SearchResults
              query={query}
              onNavigate={(next) => {
                setSection(next);
                setQuery("");
              }}
            />
          </div>
          <span
            className={`hidden whitespace-nowrap text-xs sm:block ${status === "error" ? "text-red-600" : "text-zinc-500"}`}
          >
            {status === "saving"
              ? t("common.saving")
              : status === "saved"
                ? t("common.saved")
                : (error ?? "")}
          </span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-7xl p-4 sm:p-7 lg:p-10">
            {views[section]}
          </div>
        </main>
      </div>
    </div>
  );
}
