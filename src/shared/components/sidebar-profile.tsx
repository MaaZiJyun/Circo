"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import { ProfileAvatar } from "./profile-avatar";

export function SidebarProfile({
  active,
  onNavigate,
}: {
  active: "me" | "settings" | null;
  onNavigate: (section: "me" | "settings") => void;
}) {
  const { t } = useI18n();
  const { state } = useStore();
  const name = state?.profile.name || t("nav.me");
  const avatar = state?.profile.avatarDataUrl ?? "";
  return (
    <div className="mt-auto flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <button
        onClick={() => onNavigate("me")}
        className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors ${active === "me" ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
      >
        <ProfileAvatar name={name} src={avatar} />
        <span className="truncate text-sm font-medium">{name}</span>
      </button>
      <button
        aria-label={t("nav.settings")}
        title={t("nav.settings")}
        onClick={() => onNavigate("settings")}
        className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${active === "settings" ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"}`}
      >
        <Cog6ToothIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
