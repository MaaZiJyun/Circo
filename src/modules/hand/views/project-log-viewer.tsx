"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { MarkdownPreview } from "@/modules/find/views/markdown-preview";
import { Badge, Button } from "@/shared/components/ui";
import { typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectLog } from "@/shared/model/entities";
import { projectLogTitle } from "../model/project-log";

export function ProjectLogViewer({
  log,
  onClose,
}: {
  log: ProjectLog;
  onClose: () => void;
}) {
  const { t, formatDate } = useI18n();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
      <article className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">
              {projectLogTitle(log)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <time className="text-xs text-zinc-500">
                {formatDate(log.createdAt)}
              </time>
              <Badge>{t(`hand.logPeriod.${log.period}`)}</Badge>
              <Badge>{t(typeLabels[log.type])}</Badge>
              {log.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <XMarkIcon className="size-5" />
            {t("common.close")}
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-10">
          <MarkdownPreview content={log.content} />
          {log.nextStep && (
            <section className="mt-8 border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <h3 className="text-sm font-semibold">{t("hand.nextStep")}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {log.nextStep}
              </p>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
