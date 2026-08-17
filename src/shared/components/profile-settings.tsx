"use client";

import { useRef, useState } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  ContextMenu,
  ContextMenuItem,
  type MenuPosition,
} from "@/modules/find/views/context-menu";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import { ProfileAvatar } from "./profile-avatar";
import { SectionHeader } from "./page-elements";
import { Button, Card, Field, Input } from "./ui";

const acceptedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);
const maxAvatarSize = 2 * 1024 * 1024;

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ProfileSettings() {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const [name, setName] = useState(state?.profile.name ?? "Me");
  const [error, setError] = useState("");
  const [avatarMenu, setAvatarMenu] = useState<MenuPosition | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!state) return null;

  const updateProfile = (values: Partial<typeof state.profile>) =>
    mutate((current) => ({
      ...current,
      profile: { ...current.profile, ...values },
    }));
  const saveName = () => {
    const value = name.trim();
    if (!value) return setError(t("settings.nameRequired"));
    setError("");
    setName(value);
    updateProfile({ name: value });
  };
  const selectAvatar = async (file?: File) => {
    if (!file) return;
    if (!acceptedTypes.has(file.type) || file.size > maxAvatarSize) {
      setError(t("settings.avatarInvalid"));
      return;
    }
    try {
      updateProfile({ avatarDataUrl: await readDataUrl(file) });
      setError("");
    } catch {
      setError(t("settings.avatarInvalid"));
    }
  };
  const openAvatarMenuFromKeyboard = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10"))
      return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    setAvatarMenu({ x: bounds.right, y: bounds.bottom });
  };

  return (
    <Card>
      <SectionHeader title={t("settings.profile")} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <button
            type="button"
            aria-label={t("settings.changeAvatar")}
            aria-haspopup="menu"
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:focus-visible:outline-zinc-50"
            onContextMenu={(event) => {
              event.preventDefault();
              setAvatarMenu({ x: event.clientX, y: event.clientY });
            }}
            onKeyDown={openAvatarMenuFromKeyboard}
          >
            <ProfileAvatar
              large
              name={state.profile.name}
              src={state.profile.avatarDataUrl}
            />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(event) => {
              void selectAvatar(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </div>
        <div className="w-full space-y-3">
          <Field label={t("settings.username")} hint={t("settings.avatarHint")}>
            <Input
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && saveName()}
            />
          </Field>
          <Field label={t("dashboard.birthDate")}>
            <Input
              type="date"
              value={state.profile.birthDate ?? ""}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) =>
                updateProfile({
                  birthDate: event.target.value || undefined,
                })
              }
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={saveName}>{t("common.save")}</Button>
        </div>
      </div>
      {avatarMenu && (
        <ContextMenu position={avatarMenu} onClose={() => setAvatarMenu(null)}>
          <ContextMenuItem
            onClick={() => {
              setAvatarMenu(null);
              fileRef.current?.click();
            }}
          >
            <PencilSquareIcon className="size-4" />
            {t("settings.changeAvatar")}
          </ContextMenuItem>
          <ContextMenuItem
            danger
            disabled={!state.profile.avatarDataUrl}
            onClick={() => {
              setAvatarMenu(null);
              updateProfile({ avatarDataUrl: "" });
            }}
          >
            <TrashIcon className="size-4" />
            {t("settings.removeAvatar")}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </Card>
  );
}
