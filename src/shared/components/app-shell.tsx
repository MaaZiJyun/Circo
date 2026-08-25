"use client";

import { useEffect, useState } from "react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { DashboardView } from "@/modules/dashboard/views/dashboard-view";
import { FindView } from "@/modules/find/views/find-view";
import { HandView } from "@/modules/hand/views/hand-view";
import { LandView } from "@/modules/land/views/land-view";
import { MeView } from "@/modules/me/views/me-view";
import { MindView } from "@/modules/mind/views/mind-view";
import { MessagesView } from "@/modules/messages/views/messages-view";
import { StatisticsView } from "@/modules/statistics/views/statistics-view";
import { useI18n } from "@/shared/i18n/i18n-context";
import { activeItems } from "@/shared/model/app-state";
import type { AppSection } from "@/shared/model/app-section";
import { useStore } from "@/shared/view-models/store-context";
import { AppSearchResults } from "./app-search-results";
import { AppNavigation, AppSidebar } from "./app-sidebar";
import { SettingsView } from "./settings-view";
import { SidebarProfile } from "./sidebar-profile";
import { IconButton, Input, LoadingState } from "./ui";

export function AppShell() {
  const { t } = useI18n();
  const { state, status, error, reload } = useStore();
  const [section, setSection] = useState<AppSection>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    updateCurrentTime();
    const timer = window.setInterval(updateCurrentTime, 60000);
    window.addEventListener("circo-message-delivered", updateCurrentTime);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("circo-message-delivered", updateCurrentTime);
    };
  }, []);
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
  const hasUnreadMessages = activeItems(state.messages ?? []).some(
    (message) =>
      !message.readAt && new Date(message.deliverAt).getTime() <= currentTime,
  );
  const hasUnreadLiterature = activeItems(state.sources).some(
    (source) => source.readingStatus !== "read",
  );
  const views: Record<AppSection, React.ReactNode> = {
    dashboard: <DashboardView />,
    me: <MeView />,
    find: <FindView />,
    mind: <MindView />,
    hand: <HandView />,
    land: <LandView />,
    messages: <MessagesView />,
    statistics: <StatisticsView />,
    settings: <SettingsView />,
  };
  return (
    <div className="flex h-dvh overflow-hidden bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <AppSidebar
        section={section}
        setSection={setSection}
        hasUnreadMessages={hasUnreadMessages}
        hasUnreadLiterature={hasUnreadLiterature}
      />
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 cursor-pointer bg-black/55 lg:hidden"
          onMouseDown={() => setMenuOpen(false)}
        >
          <aside
            className="flex h-full w-72 cursor-default flex-col bg-white p-5 dark:bg-zinc-950"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="brand-wordmark text-xl">{t("app.name")}</span>
              <IconButton
                label={t("common.close")}
                onClick={() => setMenuOpen(false)}
              >
                <XMarkIcon className="size-5" />
              </IconButton>
            </div>
            <AppNavigation
              section={section}
              setSection={setSection}
              close={() => setMenuOpen(false)}
              hasUnreadLiterature={hasUnreadLiterature}
            />
            <SidebarProfile
              active={section}
              onNavigate={(next) => {
                setSection(next);
                setMenuOpen(false);
              }}
              hasUnreadMessages={hasUnreadMessages}
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
            <AppSearchResults
              query={query}
              onNavigate={(next) => {
                setSection(next);
                setQuery("");
              }}
            />
          </div>
          <span className="hidden items-center sm:flex">
            {status === "saving" ? (
              <ArrowPathIcon
                className="h-4 w-4 animate-spin text-black dark:text-white"
                aria-label={t("common.saving")}
              />
            ) : status === "saved" ? (
              <CheckIcon
                className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                aria-label={t("common.saved")}
              />
            ) : status === "error" ? (
              <span className="whitespace-nowrap text-xs text-red-600">
                {error ?? ""}
              </span>
            ) : null}
          </span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="h-full mx-auto max-w-7xl p-4 sm:p-7 lg:p-10">
            {views[section]}
          </div>
        </main>
      </div>
    </div>
  );
}
