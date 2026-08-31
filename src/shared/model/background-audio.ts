import type { UserProfile } from "./app-state";

export function normalizeBackgroundAudio(
  profile?: UserProfile,
): Partial<UserProfile> {
  const tracks = profile?.backgroundAudioTracks?.length
    ? profile.backgroundAudioTracks
    : profile?.backgroundAudioToken
      ? [
          {
            token: profile.backgroundAudioToken,
            name: profile.backgroundAudioName ?? "Background music",
          },
        ]
      : [];
  return tracks.length
    ? {
        backgroundAudioTracks: tracks,
        ...(profile?.backgroundMusicEnabled
          ? { backgroundMusicEnabled: true }
          : {}),
      }
    : {};
}
