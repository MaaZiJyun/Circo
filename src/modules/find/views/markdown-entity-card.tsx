"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { AppState } from "@/shared/model/app-state";
import { useStore } from "@/shared/view-models/store-context";
import type { MarkdownCardReference } from "../model/markdown-card";

type CardItem = {
  title: string;
  subtitle: string;
  details: Array<[string, string]>;
};

function resolveCard(
  state: AppState,
  reference: MarkdownCardReference,
  noteContent: string | null,
): CardItem | null {
  if (reference.kind === "point") {
    const item = state.points.find(
      (value) => value.id === reference.id && !value.deletedAt,
    );
    return item
      ? {
          title: item.note || item.content.slice(0, 80) || "Point",
          subtitle: `${item.type} · ${item.date}`,
          details: [
            ["Content", item.content || "—"],
            ["Note", item.note || "—"],
            ["Author", item.author || "—"],
            ["Page", String(item.page)],
          ],
        }
      : null;
  }
  if (reference.kind === "idea") {
    const item = state.ideas.find(
      (value) => value.id === reference.id && !value.deletedAt,
    );
    return item
      ? {
          title: item.title,
          subtitle: `${item.status} · ${item.date}`,
          details: [
            ["Definition", item.definition || "—"],
            ["Reason", item.reason || "—"],
            ["Content", item.content || "—"],
            ["Tags", item.tags.join(", ") || "—"],
          ],
        }
      : null;
  }
  if (reference.kind === "task") {
    const item = state.tasks.find(
      (value) => value.id === reference.id && !value.deletedAt,
    );
    return item
      ? {
          title: item.title,
          subtitle: `${item.status} · ${item.dueDate || "No deadline"}`,
          details: [
            ["Description", item.description || "—"],
            ["Expected output", item.expectedOutput || "—"],
            ["Estimate", `${item.estimatedMinutes} min`],
            ["Actual", `${item.actualMinutes} min`],
          ],
        }
      : null;
  }
  if (reference.kind === "project") {
    const item = state.projects.find(
      (value) => value.id === reference.id && !value.deletedAt,
    );
    return item
      ? {
          title: item.name,
          subtitle: `${item.status} · ${item.startDate}–${item.endDate}`,
          details: [
            ["Purpose", item.purpose || "—"],
            ["Expected", item.expected || "—"],
            ["Tags", item.tags.join(", ") || "—"],
          ],
        }
      : null;
  }
  if (reference.kind === "note") {
    const source = state.sources.find(
      (value) => value.id === reference.id && !value.deletedAt,
    );
    return source
      ? {
          title: `${source.title} · Note`,
          subtitle:
            noteContent === null
              ? "Loading…"
              : `${noteContent.length} characters`,
          details: [["Note", noteContent ?? "Loading…"]],
        }
      : null;
  }
  const item = state.messages.find(
    (value) => value.id === reference.id && !value.deletedAt,
  );
  return item
    ? {
        title: item.subject,
        subtitle: `${item.readAt ? "Read" : "Unread"} · ${item.deliverAt}`,
        details: [
          ["Message", item.body || "—"],
          [
            "References",
            item.references.map((value) => value.label).join(", ") || "—",
          ],
        ],
      }
    : null;
}

export function MarkdownEntityCard({
  reference,
}: {
  reference: MarkdownCardReference;
}) {
  const { state } = useStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [noteValue, setNoteValue] = useState<{
    id: string;
    content: string;
  } | null>(null);
  useEffect(() => {
    if (reference.kind !== "note") return;
    let active = true;
    void fetch(`/api/notes/${encodeURIComponent(reference.id)}`)
      .then(async (response) => {
        const payload = (await response.json()) as { content?: string };
        if (active)
          setNoteValue({
            id: reference.id,
            content: response.ok ? (payload.content ?? "") : "",
          });
      })
      .catch(() => active && setNoteValue({ id: reference.id, content: "" }));
    return () => {
      active = false;
    };
  }, [reference.id, reference.kind]);
  const noteContent = noteValue?.id === reference.id ? noteValue.content : null;
  const item = state ? resolveCard(state, reference, noteContent) : null;
  return (
    <>
      <button
        type="button"
        onClick={() => item && setOpen(true)}
        disabled={!item}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-600"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {reference.kind}
        </span>
        <span className="mt-1 block font-semibold">
          {item?.title ?? t("find.cardUnavailable")}
        </span>
        {item && (
          <span className="mt-1 block text-xs text-zinc-500">
            {item.subtitle}
          </span>
        )}
      </button>
      {open && item && (
        <Dialog
          open
          title={item.title}
          closeLabel={t("common.close")}
          onClose={() => setOpen(false)}
        >
          <dl className="grid gap-4">
            {item.details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-zinc-500">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Dialog>
      )}
    </>
  );
}
