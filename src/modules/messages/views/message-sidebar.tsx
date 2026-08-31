"use client";

import { ArchiveBoxIcon, EnvelopeIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Button } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

export type Mailbox = "inbox" | "sent" | "bin";
const folders = [
  { id: "inbox", key: "messages.inbox", icon: EnvelopeIcon },
  { id: "sent", key: "messages.sent", icon: PaperAirplaneIcon },
  { id: "bin", key: "messages.bin", icon: ArchiveBoxIcon },
] as const;
export function MessageSidebar({ mailbox, counts, onChange, onCompose }: {
  mailbox: Mailbox;
  counts: Record<Mailbox, number>;
  onChange: (mailbox: Mailbox) => void;
  onCompose: () => void;
}) {
  const { t } = useI18n();
  return (
    <aside className="border-b border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 md:border-b-0 md:border-r">
      <Button className="w-full justify-center rounded-xl shadow-sm" onClick={onCompose}>
        <PaperAirplaneIcon className="size-4" />{t("messages.compose")}
      </Button>
      <nav className="mt-5 grid gap-1">
        {folders.map((folder) => {
          const Icon = folder.icon;
          return <button key={folder.id} onClick={() => onChange(folder.id)}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${mailbox === folder.id ? "bg-zinc-950 font-semibold text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950" : "hover:bg-zinc-200/70 dark:hover:bg-zinc-800"}`}>
            <Icon className="size-5" /><span>{t(folder.key)}</span><span className="ml-auto text-xs">{counts[folder.id]}</span>
          </button>;
        })}
      </nav>
    </aside>
  );
}
