"use client";

import { useState } from "react";
import { Card } from "@/shared/components/ui";
import type { FutureMessage } from "@/shared/model/message";
import { shouldCelebrateDailySummary } from "@/shared/model/message-kind";
import { useMessages } from "../view-models/use-messages";
import { MessageComposeDialog } from "./message-compose-dialog";
import { MessageList } from "./message-list";
import { MessageReader } from "./message-reader";
import { MessageSidebar, type Mailbox } from "./message-sidebar";
import { SummaryCelebration } from "./summary-celebration";

type ComposeSeed = { subject: string; body: string } | null;
export function MessagesView() {
  const vm = useMessages();
  const [mailbox, setMailbox] = useState<Mailbox>("inbox");
  const [selected, setSelected] = useState<string[]>([]);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [compose, setCompose] = useState<ComposeSeed | undefined>();
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  if (!vm) return null;
  const rows =
    mailbox === "inbox"
      ? vm.delivered
      : mailbox === "sent"
        ? vm.messages
        : vm.bin;
  const opened = openedId
    ? ([...vm.messages, ...vm.bin].find((message) => message.id === openedId) ??
      null)
    : null;
  const openCompose = (seed: ComposeSeed = null) => setCompose(seed);
  const reply = (message: FutureMessage) =>
    openCompose({
      subject: message.subject.startsWith("Re:")
        ? message.subject
        : `Re: ${message.subject}`,
      body: `\n\n---\n${message.body}`,
    });
  const forward = (message: FutureMessage) =>
    openCompose({
      subject: message.subject.startsWith("Fwd:")
        ? message.subject
        : `Fwd: ${message.subject}`,
      body: `\n\n--- Forwarded message ---\n${message.body}`,
    });
  const changeMailbox = (next: Mailbox) => {
    setMailbox(next);
    setOpenedId(null);
    setSelected([]);
  };
  const remove = (ids: string[]) => {
    vm.deleteMany(ids);
    setSelected([]);
    if (opened && ids.includes(opened.id)) setOpenedId(null);
  };
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden p-0">
        <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
          <MessageSidebar
            mailbox={mailbox}
            counts={{
              inbox: vm.delivered.length,
              sent: vm.messages.length,
              bin: vm.bin.length,
            }}
            onChange={changeMailbox}
            onCompose={() => openCompose()}
          />
          <main className="min-w-0">
            {opened ? (
              <MessageReader
                message={opened}
                profile={vm.profile}
                onBack={() => setOpenedId(null)}
                onDelete={() => remove([opened.id])}
                onReply={() => reply(opened)}
                onForward={() => forward(opened)}
                onMarkUnread={() => vm.markUnread(opened.id)}
                onImportPlan={() => vm.importDailyPlan(opened)}
              />
            ) : (
              <MessageList
                rows={rows}
                mailbox={mailbox}
                selected={selected}
                onSelected={setSelected}
                onOpen={(message) => {
                  const celebrate = shouldCelebrateDailySummary(message);
                  setCelebratingId(celebrate ? message.id : null);
                  setOpenedId(message.id);
                  vm.openMessage(message.id, celebrate);
                }}
                onDelete={remove}
                onFavorite={vm.favoriteMany}
                onReply={reply}
                onForward={forward}
                onRestore={vm.restoreMessage}
              />
            )}
          </main>
        </div>
        {compose !== undefined && (
          <MessageComposeDialog
            key={compose?.subject ?? "new"}
            references={vm.referenceOptions}
            initial={compose ?? undefined}
            onClose={() => setCompose(undefined)}
            onSend={vm.send}
          />
        )}
      </Card>
      {opened?.id === celebratingId && <SummaryCelebration />}
    </div>
  );
}
