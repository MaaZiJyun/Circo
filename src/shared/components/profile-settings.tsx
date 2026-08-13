"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useStore } from "@/shared/view-models/store-context";
import { ProfileAvatar } from "./profile-avatar";
import { SectionHeader } from "./page-elements";
import { Button, Card, Field, Input } from "./ui";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
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

  return (
    <Card>
      <SectionHeader title={t("settings.profile")} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <ProfileAvatar
            large
            name={state.profile.name}
            src={state.profile.avatarDataUrl}
          />
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            {t("settings.changeAvatar")}
          </Button>
          {state.profile.avatarDataUrl && (
            <Button variant="ghost" onClick={() => updateProfile({ avatarDataUrl: "" })}>
              {t("settings.removeAvatar")}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
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
              onChange={(event) => updateProfile({
                birthDate: event.target.value || undefined,
              })}
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={saveName}>{t("common.save")}</Button>
        </div>
      </div>
    </Card>
  );
}
