"use client";

import { useEffect } from "react";
import { useStore } from "@/shared/view-models/store-context";

const targetVolume = 0.35;
const fadeDuration = 2000;

export function BackgroundMusicPlayer() {
  const { state } = useStore();
  const enabled = state?.profile.backgroundMusicEnabled ?? false;
  const tracks = state?.profile.backgroundAudioTracks;

  useEffect(() => {
    if (!enabled || !tracks?.length) return;
    const audio = new Audio();
    audio.preload = "auto";
    let disposed = false;
    let fadeTimer: number | undefined;
    let lastToken = "";
    let fadingOut = false;

    const clearFade = () => {
      if (fadeTimer !== undefined) window.clearInterval(fadeTimer);
      fadeTimer = undefined;
    };
    const fadeTo = (volume: number, duration: number) => {
      clearFade();
      const initial = audio.volume;
      const startedAt = performance.now();
      fadeTimer = window.setInterval(() => {
        const progress = Math.min(
          1,
          (performance.now() - startedAt) / duration,
        );
        audio.volume = initial + (volume - initial) * progress;
        if (progress === 1) clearFade();
      }, 50);
    };
    const randomTrack = () => {
      const choices =
        tracks.length > 1
          ? tracks.filter((track) => track.token !== lastToken)
          : tracks;
      return choices[Math.floor(Math.random() * choices.length)];
    };
    const removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    const attemptPlay = () => {
      void audio
        .play()
        .then(() => {
          removeUnlockListeners();
          fadeTo(targetVolume, fadeDuration);
        })
        .catch(() => {
          window.addEventListener("pointerdown", unlock, { once: true });
          window.addEventListener("keydown", unlock, { once: true });
        });
    };
    const startRandomTrack = () => {
      if (disposed) return;
      const track = randomTrack();
      lastToken = track.token;
      fadingOut = false;
      audio.volume = 0;
      audio.src = `/api/background-audio/${track.token}`;
      attemptPlay();
    };
    function unlock() {
      if (!disposed) attemptPlay();
    }
    const handleTimeUpdate = () => {
      if (
        !fadingOut &&
        Number.isFinite(audio.duration) &&
        audio.duration - audio.currentTime <= fadeDuration / 1000
      ) {
        fadingOut = true;
        fadeTo(0, Math.max(100, (audio.duration - audio.currentTime) * 1000));
      }
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", startRandomTrack);
    startRandomTrack();
    return () => {
      disposed = true;
      removeUnlockListeners();
      clearFade();
      const initial = audio.volume;
      const startedAt = performance.now();
      const stopTimer = window.setInterval(() => {
        const progress = Math.min(1, (performance.now() - startedAt) / 400);
        audio.volume = initial * (1 - progress);
        if (progress === 1) {
          window.clearInterval(stopTimer);
          audio.pause();
          audio.removeAttribute("src");
        }
      }, 40);
    };
  }, [enabled, tracks]);

  return null;
}
