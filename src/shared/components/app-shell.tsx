"use client";

import { useEffect, useState } from "react";
import {
  Bars3Icon,
  LightBulbIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TrophyIcon,
  BeakerIcon,
  EnvelopeIcon,
  BookOpenIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { DashboardView } from "@/modules/dashboard/views/dashboard-view";
import { FindView } from "@/modules/find/views/find-view";
import { HandView } from "@/modules/hand/views/hand-view";
import { LandView } from "@/modules/land/views/land-view";
import { MeView } from "@/modules/me/views/me-view";
import { MindView } from "@/modules/mind/views/mind-view";
import { MessagesView } from "@/modules/messages/views/messages-view";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import { activeItems } from "@/shared/model/app-state";
import type { AppSection } from "@/shared/model/app-section";
import { useStore } from "@/shared/view-models/store-context";
import { AppSearchResults } from "./app-search-results";
import { SettingsView } from "./settings-view";
import { SidebarProfile } from "./sidebar-profile";
import { IconButton, Input, LoadingState } from "./ui";

const navigation: {
  id: AppSection;
  label: MessageKey;
  icon: typeof HomeIcon;
}[] = [
  { id: "dashboard", label: "nav.dashboard", icon: HomeIcon },
  { id: "messages", label: "nav.messages", icon: EnvelopeIcon },
  { id: "find", label: "nav.find", icon: BookOpenIcon },
  { id: "mind", label: "nav.mind", icon: LightBulbIcon },
  { id: "hand", label: "nav.hand", icon: BeakerIcon },
  { id: "land", label: "nav.land", icon: RocketLaunchIcon },
];

function Navigation({
  section,
  setSection,
  close,
  collapsed = false,
  hasUnreadMessages = false,
  hasUnreadLiterature = false,
}: {
  section: AppSection;
  setSection: (section: AppSection) => void;
  close?: () => void;
  collapsed?: boolean;
  hasUnreadMessages?: boolean;
  hasUnreadLiterature?: boolean;
}) {
  const { t } = useI18n();
  return (
    <nav className="grid gap-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.id === section;
        const showUnread =
          (item.id === "messages" && hasUnreadMessages) ||
          (item.id === "find" && hasUnreadLiterature);
        return (
          <button
            key={item.id}
            aria-label={collapsed ? t(item.label) : undefined}
            title={collapsed ? t(item.label) : undefined}
            onClick={() => {
              setSection(item.id);
              close?.();
            }}
            className={`flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${active ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"}`}
          >
            <span className="relative shrink-0">
              <Icon className="size-5" aria-hidden="true" />
              {showUnread && (
                <span
                  className="absolute -left-1 -top-1 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950"
                  aria-hidden="true"
                />
              )}
            </span>
            {showUnread && (
              <span className="sr-only">
                {t(item.id === "find" ? "find.unread" : "messages.unread")}
              </span>
            )}
            {!collapsed && t(item.label)}
          </button>
        );
      })}
    </nav>
  );
}

function Sidebar({
  section,
  setSection,
  hasUnreadMessages,
  hasUnreadLiterature,
}: {
  section: AppSection;
  setSection: (section: AppSection) => void;
  hasUnreadMessages: boolean;
  hasUnreadLiterature: boolean;
}) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const toggleLabel = collapsed
    ? t("common.expandSidebar")
    : t("common.collapseSidebar");
  return (
    <aside
      className={`hidden shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-black lg:flex lg:flex-col ${collapsed ? "w-20 p-3" : "w-64 p-5"}`}
    >
      <div
        className={`mb-10 flex items-center ${collapsed ? "justify-center" : "justify-between gap-3 px-2"}`}
      >
        {!collapsed && (
          <div>
            <p className="brand-wordmark text-3xl">{t("app.name")}</p>
            <p className="text-xs text-zinc-500">{t("common.localOnly")}</p>
          </div>
        )}
        <IconButton
          label={toggleLabel}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? (
            <ChevronDoubleRightIcon className="size-5" />
          ) : (
            <ChevronDoubleLeftIcon className="size-5" />
          )}
        </IconButton>
      </div>
      <Navigation
        section={section}
        setSection={setSection}
        collapsed={collapsed}
        hasUnreadMessages={hasUnreadMessages}
        hasUnreadLiterature={hasUnreadLiterature}
      />
      <SidebarProfile
        active={section === "me" || section === "settings" ? section : null}
        onNavigate={setSection}
        collapsed={collapsed}
      />
    </aside>
  );
}

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
    settings: <SettingsView />,
  };
  return (
    <div className="flex h-dvh overflow-hidden bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Sidebar
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
            <Navigation
              section={section}
              setSection={setSection}
              close={() => setMenuOpen(false)}
              hasUnreadMessages={hasUnreadMessages}
              hasUnreadLiterature={hasUnreadLiterature}
            />
            <SidebarProfile
              active={
                section === "me" || section === "settings" ? section : null
              }
              onNavigate={(next) => {
                setSection(next);
                setMenuOpen(false);
              }}
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
