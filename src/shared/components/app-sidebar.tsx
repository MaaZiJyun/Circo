"use client";

import { useState } from "react";
import {
  BeakerIcon,
  BookOpenIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  HomeIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import type { AppSection } from "@/shared/model/app-section";
import { IconButton } from "./ui";
import { SidebarProfile } from "./sidebar-profile";

const navigation: {
  id: AppSection;
  label: MessageKey;
  icon: typeof HomeIcon;
}[] = [
  { id: "dashboard", label: "nav.dashboard", icon: HomeIcon },
  { id: "find", label: "nav.find", icon: BookOpenIcon },
  { id: "mind", label: "nav.mind", icon: LightBulbIcon },
  { id: "hand", label: "nav.hand", icon: BeakerIcon },
  { id: "land", label: "nav.land", icon: RocketLaunchIcon },
];

export function AppNavigation({
  section,
  setSection,
  close,
  collapsed = false,
  hasUnreadLiterature = false,
}: {
  section: AppSection;
  setSection: (section: AppSection) => void;
  close?: () => void;
  collapsed?: boolean;
  hasUnreadLiterature?: boolean;
}) {
  const { t } = useI18n();
  return (
    <nav className="grid gap-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.id === section;
        const showUnread = item.id === "find" && hasUnreadLiterature;
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
            {showUnread && <span className="sr-only">{t("find.unread")}</span>}
            {!collapsed && t(item.label)}
          </button>
        );
      })}
    </nav>
  );
}

export function AppSidebar({
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
          <div className="flex items-end justify-center gap-1">
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
      <AppNavigation
        section={section}
        setSection={setSection}
        collapsed={collapsed}
        hasUnreadLiterature={hasUnreadLiterature}
      />
      <SidebarProfile
        active={section}
        onNavigate={setSection}
        collapsed={collapsed}
        hasUnreadMessages={hasUnreadMessages}
      />
    </aside>
  );
}
