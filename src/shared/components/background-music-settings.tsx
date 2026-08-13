"use client";

import { useRef, useState } from "react";
import { MusicalNoteIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { BackgroundAudioTrack } from "@/shared/model/app-state";
import { useStore } from "@/shared/view-models/store-context";
import { SectionHeader } from "./page-elements";
import { Button, Card } from "./ui";

export function BackgroundMusicSettings() {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!state) return null;
  const tracks = state.profile.backgroundAudioTracks ?? [];
  const enabled = state.profile.backgroundMusicEnabled ?? false;
  const updateTracks = (
    updater: (current: BackgroundAudioTrack[]) => BackgroundAudioTrack[],
  ) =>
    mutate((current) => {
      const next = updater(current.profile.backgroundAudioTracks ?? []);
      return {
        ...current,
        profile: {
          ...current.profile,
          backgroundAudioTracks: next,
          backgroundMusicEnabled:
            next.length > 0 &&
            (current.profile.backgroundMusicEnabled ?? false),
        },
      };
    });
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/background-audio", {
          method: "POST",
          body: form,
        });
        const payload = (await response.json()) as {
          token?: string;
          name?: string;
          error?: string;
        };
        if (!response.ok || !payload.token)
          throw new Error(payload.error || t("settings.musicUploadFailed"));
        const track = { token: payload.token, name: payload.name || file.name };
        updateTracks((current) => [...current, track]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const remove = async (track: BackgroundAudioTrack) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/background-audio/${track.token}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("settings.musicRemoveFailed"));
      updateTracks((current) =>
        current.filter((item) => item.token !== track.token),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <SectionHeader
        title={t("settings.backgroundMusic")}
        action={
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <MusicalNoteIcon className="size-4" />
            {t("settings.uploadMusic")}
          </Button>
        }
      />
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="audio/mpeg,.mp3"
        multiple
        onChange={(event) => void upload(event.target.files)}
      />
      <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
        {tracks.map((track) => (
          <div
            key={track.token}
            className="flex min-h-12 items-center gap-3 py-2 border-b border-zinc-200 dark:border-zinc-800"
          >
            <MusicalNoteIcon className="size-4 shrink-0 text-zinc-500" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {track.name}
            </span>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => void remove(track)}
            >
              <TrashIcon className="size-4" />
              {t("settings.removeMusic")}
            </Button>
          </div>
        ))}
        {!tracks.length && (
          <p className="py-4 text-sm text-zinc-500">
            {t("settings.musicEmpty")}
          </p>
        )}
      </div>

      <label className="flex min-h-11 mt-4 items-center justify-between gap-4 dark:border-zinc-800">
        <span>
          <span className="block text-sm font-medium">
            {t("settings.backgroundMusicPlayback")}
          </span>
          <span className="block text-xs text-zinc-500">
            {t("settings.backgroundMusicHint")}
          </span>
        </span>
        <input
          type="checkbox"
          className="size-4"
          checked={enabled}
          disabled={!tracks.length}
          onChange={(event) =>
            mutate((current) => ({
              ...current,
              profile: {
                ...current.profile,
                backgroundMusicEnabled: event.target.checked,
              },
            }))
          }
        />
      </label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
