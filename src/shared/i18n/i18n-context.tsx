"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { en } from "./en";
import { zh, type MessageKey } from "./zh";

export type Locale = "zh-CN" | "en";

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  formatDate: (value: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const localeEvent = "circo-locale-change";

function getSavedLocale(): Locale {
  const stored = window.localStorage.getItem("circo-locale");
  if (stored === "en" || stored === "zh-CN") return stored;
  return window.navigator.language.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en";
}

function subscribeLocale(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(localeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(localeEvent, callback);
  };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    getSavedLocale,
    () => "zh-CN",
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem("circo-locale", nextLocale);
    window.dispatchEvent(new Event(localeEvent));
  }, []);

  const value = useMemo<I18nValue>(() => {
    const messages = locale === "zh-CN" ? zh : en;
    return {
      locale,
      setLocale,
      t: (key) => messages[key],
      formatDate: (date) => {
        if (!date) return "—";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "—";
        return new Intl.DateTimeFormat(locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(parsed);
      },
      formatNumber: (number, options) =>
        new Intl.NumberFormat(locale, options).format(number),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
}
