"use client";

import { I18nProvider } from "@/shared/i18n/i18n-context";
import { ThemeProvider } from "@/shared/theme/theme-context";
import { StoreProvider } from "@/shared/view-models/store-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <StoreProvider>{children}</StoreProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
