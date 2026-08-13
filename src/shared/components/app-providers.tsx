"use client";

import { I18nProvider } from "@/shared/i18n/i18n-context";
import { ThemeProvider } from "@/shared/theme/theme-context";
import { StoreProvider } from "@/shared/view-models/store-context";
import { BackgroundMusicPlayer } from "./background-music-player";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <StoreProvider>
          <BackgroundMusicPlayer />
          {children}
        </StoreProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
