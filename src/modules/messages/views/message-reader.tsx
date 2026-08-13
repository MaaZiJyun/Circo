"use client";

import { ArrowLeftIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, PaperClipIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Badge, IconButton } from "@/shared/components/ui";
import { ProfileAvatar } from "@/shared/components/profile-avatar";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { FutureMessage } from "@/shared/model/message";

export function MessageReader({ message, profile, onBack, onDelete, onReply, onForward }: {
  message: FutureMessage;
  profile: { name: string; avatarDataUrl: string };
  onBack: () => void; onDelete: () => void; onReply: () => void; onForward: () => void;
}) {
  const { t, formatDate } = useI18n();
  return (
    <article>
      <div className="flex items-center gap-1 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <IconButton label={t("messages.back")} onClick={onBack}><ArrowLeftIcon className="size-5" /></IconButton>
        <IconButton label={t("common.delete")} onClick={onDelete}><TrashIcon className="size-5" /></IconButton>
        <IconButton label={t("messages.reply")} onClick={onReply}><ArrowUturnLeftIcon className="size-5" /></IconButton>
        <IconButton label={t("messages.forward")} onClick={onForward}><ArrowUturnRightIcon className="size-5" /></IconButton>
      </div>
      <div className="p-6">
        <h2 className="text-2xl font-semibold">{message.subject}</h2>
        <div className="mt-6 flex items-start gap-3">
          <ProfileAvatar name={profile.name} src={profile.avatarDataUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-semibold">{profile.name}</p>
              <time className="text-xs text-zinc-500">{formatDate(message.deliverAt)}</time>
            </div>
            <p className="text-xs text-zinc-500">{t("messages.to")}: {t("messages.futureSelf")}</p>
          </div>
        </div>
        <div className="min-h-48 whitespace-pre-wrap py-8 text-sm leading-7">{message.body}</div>
        {!!message.attachments.length && <section className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-semibold">{t("messages.attachments")}</h3>
          <div className="flex flex-wrap gap-2">{message.attachments.map((item) =>
            <a key={item.fileToken} href={`/api/attachments/${item.fileToken}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <PaperClipIcon className="size-4" />{item.name}
            </a>)}</div>
        </section>}
        {!!message.references.length && <section className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-semibold">{t("messages.references")}</h3>
          <div className="flex flex-wrap gap-2">{message.references.map((item) => <Badge key={`${item.kind}-${item.id}`}>{item.label}</Badge>)}</div>
        </section>}
      </div>
    </article>
  );
}
