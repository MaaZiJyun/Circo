"use client";

import { useEffect, useRef, useState } from "react";
import {
  FolderOpenIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { BackgroundAudioTrack } from "@/shared/model/app-state";
import { useStore } from "@/shared/view-models/store-context";
import { SectionHeader } from "./page-elements";
import { Button, Card, Field, Input, Switch } from "./ui";

export function BackgroundMusicSettings() {
  const { t } = useI18n();
  const { state, mutate } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [savingPath, setSavingPath] = useState(false);
  const [pickingPath, setPickingPath] = useState(false);
  const [directory, setDirectory] = useState("");
  const [savedDirectory, setSavedDirectory] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch("/api/background-audio/config", { cache: "no-store" })
      .then(async (response) => {
        const value = (await response.json()) as {
          directory?: string;
          error?: string;
        };
        if (!response.ok || !value.directory)
          throw new Error(value.error || t("common.error"));
        if (active) {
          setDirectory(value.directory);
          setSavedDirectory(value.directory);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => {
      active = false;
    };
  }, [t]);
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
  const pickPath = async () => {
    setPickingPath(true);
    setError("");
    try {
      const response = await fetch("/api/path-picker?kind=music", {
        method: "POST",
      });
      if (response.status === 204) return;
      const value = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !value.path)
        throw new Error(value.error || t("settings.pickerUnavailable"));
      setDirectory(value.path);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPickingPath(false);
    }
  };
  const savePath = async () => {
    setSavingPath(true);
    setError("");
    try {
      const response = await fetch("/api/background-audio/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory }),
      });
      const value = (await response.json()) as {
        directory?: string;
        error?: string;
      };
      if (!response.ok || !value.directory)
        throw new Error(value.error || t("common.error"));
      setDirectory(value.directory);
      setSavedDirectory(value.directory);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSavingPath(false);
    }
  };
  const pathDirty = directory.trim() !== savedDirectory;
  const working = busy || savingPath || pickingPath;
  return (
    <Card>
      <SectionHeader
        title={t("settings.backgroundMusic")}
        action={
          <Button
            variant="secondary"
            disabled={working || !savedDirectory || pathDirty}
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
      <label className="flex min-h-11 mt-4 items-center justify-between gap-4 dark:border-zinc-800">
        <span>
          <span className="block text-sm font-medium">
            {t("settings.backgroundMusicPlayback")}
          </span>
          <span className="block text-xs text-zinc-500">
            {t("settings.backgroundMusicHint")}
          </span>
        </span>
        <Switch
          checked={enabled}
          disabled={!tracks.length}
          onChange={(checked) =>
            mutate((current) => ({
              ...current,
              profile: {
                ...current.profile,
                backgroundMusicEnabled: checked,
              },
            }))
          }
        />
      </label>
      <div className="mt-4">
        <Field label={t("settings.backgroundMusicDirectory")}>
          <div className="flex flex-wrap gap-2">
            <Input
              value={directory}
              spellCheck={false}
              className="min-w-64 flex-1 font-mono text-xs"
              onChange={(event) => setDirectory(event.target.value)}
            />
            <Button
              variant="secondary"
              disabled={working}
              onClick={() => void pickPath()}
            >
              <FolderOpenIcon className="size-4" />
              {t("settings.choosePath")}
            </Button>
            <Button
              disabled={working || !directory.trim() || !pathDirty}
              onClick={() => void savePath()}
            >
              {savingPath ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </Field>
        <p className="mt-1 text-xs text-zinc-500">
          {t("settings.backgroundMusicDirectoryHint")}
        </p>
      </div>
      {/* <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
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
              disabled={working}
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
      </div> */}

      
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
