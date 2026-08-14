"use client";

import { useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Badge, Button, Card, Textarea } from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Idea, IdeaChatMessage } from "@/shared/model/entities";
import { EvaluationSummary } from "./idea-evaluation-dialog";

export function IdeaReader({
  idea,
  busy,
  onSend,
  onDeleteMessage,
}: {
  idea: Idea;
  busy: boolean;
  onSend: (message: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => void;
}) {
  return (
    <div className="grid gap-5 xl:h-screen xl:max-h-screen xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
      <div className="flex flex-col gap-5 xl:h-full xl:min-h-0 xl:overflow-y-auto">
        {idea.evaluation && (
          <Card>
            <EvaluationSummary idea={idea} />
          </Card>
        )}
        <IdeaInfo idea={idea} />
      </div>
      <IdeaChat
        idea={idea}
        busy={busy}
        onSend={onSend}
        onDeleteMessage={onDeleteMessage}
      />
    </div>
  );
}

function IdeaInfo({ idea }: { idea: Idea }) {
  const { t, formatDate } = useI18n();
  return (
    <Card className="flex-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{t("mind.info")}</h2>
        <Badge>{t(statusLabels[idea.status])}</Badge>
      </div>
      <h1 className="mt-5 text-2xl font-semibold leading-tight">
        {idea.title}
      </h1>
      {!!idea.tags.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
      <InfoBlock label={t("mind.definition")} value={idea.definition} />
      <InfoBlock label={t("mind.reason")} value={idea.reason} />
      <div className="mt-5 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
        {t("mind.date")}: {formatDate(idea.date || idea.createdAt)}
      </div>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <section className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        {value || "—"}
      </p>
    </section>
  );
}

function IdeaChat({
  idea,
  busy,
  onSend,
  onDeleteMessage,
}: {
  idea: Idea;
  busy: boolean;
  onSend: (message: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => void;
}) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages: IdeaChatMessage[] = [
    {
      id: `${idea.id}_initial`,
      role: "assistant",
      content: idea.definition || idea.content,
      createdAt: idea.createdAt,
    },
    ...(idea.chatMessages ?? []),
  ];
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);
  const send = async () => {
    const content = message.trim();
    if (!content || busy) return;
    setMessage("");
    await onSend(content);
  };
  return (
    <Card className="flex min-h-[640px] flex-col overflow-hidden p-0 xl:h-full xl:min-h-0">
      <header className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h2 className="font-semibold">{t("mind.ideaChat")}</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((item, index) => (
          <div
            key={item.id}
            className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`group flex max-w-[88%] items-start gap-1 ${item.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "user" ? "rounded-br-md bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" : "rounded-bl-md bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"}`}
              >
                {item.content}
              </div>
              {index > 0 && (
                <button
                  type="button"
                  className="mt-1 rounded-full p-2 text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-red-950/40"
                  aria-label={t("mind.deleteChatMessage")}
                  title={t("mind.deleteChatMessage")}
                  onClick={() => onDeleteMessage(item.id)}
                >
                  <TrashIcon className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="w-fit rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:bg-zinc-900">
            <span className="inline-block animate-pulse">•••</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-end gap-2">
          <Textarea
            className="min-h-11 flex-1 resize-none"
            rows={1}
            value={message}
            placeholder={t("mind.ideaChatHint")}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
          />
          <Button
            className="size-11 shrink-0 rounded-full px-0"
            disabled={!message.trim() || busy}
            aria-label={t("mind.sendMessage")}
            title={t("mind.sendMessage")}
            onClick={() => void send()}
          >
            <PaperAirplaneIcon className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
