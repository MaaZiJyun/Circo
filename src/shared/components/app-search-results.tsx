"use client";

import { useMemo } from "react";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import { activeItems } from "@/shared/model/app-state";
import { useStore } from "@/shared/view-models/store-context";
import type { AppSection } from "./app-shell";

export function AppSearchResults({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: (section: AppSection) => void;
}) {
  const { t } = useI18n();
  const { state } = useStore();
  const results = useMemo(() => {
    if (!state || query.trim().length < 2) return [];
    const needle = query.toLowerCase();
    const groups = [
      {
        section: "me" as const,
        items: activeItems(state.goals),
        text: (item: { title: string; unit: string }) =>
          `${item.title} ${item.unit}`,
      },
      {
        section: "find" as const,
        items: activeItems(state.sources),
        text: (item: { title: string; content: string; tags: string[] }) =>
          `${item.title} ${item.content} ${item.tags.join(" ")}`,
      },
      {
        section: "mind" as const,
        items: activeItems(state.ideas),
        text: (item: { title: string; content: string; tags: string[] }) =>
          `${item.title} ${item.content} ${item.tags.join(" ")}`,
      },
      {
        section: "hand" as const,
        items: activeItems(state.projects),
        text: (item: { name: string; purpose: string; tags: string[] }) =>
          `${item.name} ${item.purpose} ${item.tags.join(" ")}`,
      },
      {
        section: "land" as const,
        items: activeItems(state.artifacts),
        text: (item: { title: string; content: string; tags: string[] }) =>
          `${item.title} ${item.content} ${item.tags.join(" ")}`,
      },
    ];
    return groups
      .flatMap((group) =>
        group.items
          .filter((item) =>
            group
              .text(item as never)
              .toLowerCase()
              .includes(needle),
          )
          .map((item) => ({
            id: item.id,
            title:
              "title" in item
                ? String(item.title)
                : String((item as { name: string }).name),
            section: group.section,
          })),
      )
      .slice(0, 8);
  }, [state, query]);
  if (query.trim().length < 2) return null;
  return (
    <div className="absolute left-0 right-0 top-12 z-30 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      {results.length ? (
        results.map((result) => (
          <button
            key={result.id}
            onClick={() => onNavigate(result.section)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <span>{result.title}</span>
            <span className="text-xs text-zinc-500">
              {t(`nav.${result.section}` as MessageKey)}
            </span>
          </button>
        ))
      ) : (
        <p className="p-3 text-sm text-zinc-500">
          {t("dashboard.searchEmpty")}
        </p>
      )}
    </div>
  );
}
