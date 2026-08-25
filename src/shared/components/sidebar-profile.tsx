"use client";

import { useState } from "react";
import {
  ChartBarIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { AppSection } from "@/shared/model/app-section";
import { useStore } from "@/shared/view-models/store-context";
import { ContextMenu, ContextMenuItem } from "./context-menu";
import { ProfileAvatar } from "./profile-avatar";

type UserSection = "messages" | "statistics" | "settings";
const userSections: readonly AppSection[] = [
  "messages",
  "statistics",
  "settings",
];

export function SidebarProfile({
  active,
  onNavigate,
  collapsed = false,
  hasUnreadMessages = false,
}: {
  active: AppSection;
  onNavigate: (section: AppSection) => void;
  collapsed?: boolean;
  hasUnreadMessages?: boolean;
}) {
  const { t } = useI18n();
  const { state } = useStore();
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const name = state?.profile.name || t("nav.me");
  const avatar = state?.profile.avatarDataUrl ?? "";
  const musicPlaying = state?.profile.backgroundMusicEnabled ?? false;
  const isActive = userSections.includes(active);
  const navigate = (section: UserSection) => {
    setMenuPosition(null);
    onNavigate(section);
  };

  return (
    <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <button
        aria-label={collapsed ? name : undefined}
        aria-haspopup="menu"
        aria-expanded={Boolean(menuPosition)}
        title={collapsed ? name : undefined}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          setMenuPosition((current) =>
            current
              ? null
              : {
                  x: collapsed ? bounds.right + 8 : bounds.left,
                  y: bounds.top,
                },
          );
        }}
        className={`flex min-h-12 w-full min-w-0 items-center rounded-xl p-2 text-left transition-colors ${collapsed ? "justify-center" : "gap-3"} ${isActive ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
      >
        <span className="relative shrink-0">
          <ProfileAvatar
            name={name}
            src={avatar}
            className={musicPlaying ? "background-music-avatar" : ""}
          />
          {hasUnreadMessages && (
            <span
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950"
              aria-hidden="true"
            />
          )}
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-zinc-500">
              {musicPlaying ? "Music Playing" : "Everything is fine"}
            </p>
          </div>
        )}
      </button>
      {menuPosition && (
        <ContextMenu
          position={menuPosition}
          onClose={() => setMenuPosition(null)}
        >
          <ContextMenuItem
            icon={
              <span className="relative">
                <EnvelopeIcon className="size-4" />
                {hasUnreadMessages && (
                  <span
                    className="absolute -right-1 -top-1 size-2 rounded-full bg-red-500"
                    aria-hidden="true"
                  />
                )}
              </span>
            }
            onClick={() => navigate("messages")}
          >
            {t("nav.messages")}
          </ContextMenuItem>
          <ContextMenuItem
            icon={<ChartBarIcon />}
            onClick={() => navigate("statistics")}
          >
            {t("nav.statistics")}
          </ContextMenuItem>
          <ContextMenuItem
            icon={<Cog6ToothIcon />}
            onClick={() => navigate("settings")}
          >
            {t("nav.settings")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </div>
  );
}
