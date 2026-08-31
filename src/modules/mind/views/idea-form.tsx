"use client";

import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Field,
  Input,
  Select,
  Tabs,
  Textarea,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { MessageKey } from "@/shared/i18n/zh";
import type { Idea, LibraryList } from "@/shared/model/entities";
import { today } from "@/shared/model/factories";
import type { IdeaInput } from "../view-models/use-mind-view-model";

export const methods: { value: Idea["method"]; label: MessageKey }[] = [
  { value: "combine", label: "mind.combine" },
  { value: "transfer", label: "mind.transfer" },
  { value: "alternative", label: "mind.alternative" },
  { value: "premise", label: "mind.premise" },
  { value: "followUp", label: "mind.followUp" },
  { value: "macro", label: "mind.macro" },
  { value: "micro", label: "mind.micro" },
];

const emptyInput = (): IdeaInput => ({
  title: "",
  definition: "",
  reason: "",
  date: today(),
  tags: [],
});

export function IdeaFields({
  value,
  onChange,
}: {
  value: IdeaInput;
  onChange: (value: IdeaInput) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4">
      <Field label={t("mind.name")}>
        <Input
          value={value.title}
          onChange={(event) =>
            onChange({ ...value, title: event.target.value })
          }
        />
      </Field>
      <Field label={t("mind.definition")}>
        <Textarea
          value={value.definition}
          onChange={(event) =>
            onChange({ ...value, definition: event.target.value })
          }
          placeholder={t("mind.ideaContent")}
        />
      </Field>
      <Field label={t("mind.reason")}>
        <Textarea
          className="min-h-20"
          value={value.reason}
          onChange={(event) =>
            onChange({ ...value, reason: event.target.value })
          }
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("mind.date")}>
          <Input
            type="date"
            value={value.date}
            onChange={(event) =>
              onChange({ ...value, date: event.target.value })
            }
          />
        </Field>
        <Field label={t("common.tags")}>
          <Input
            value={value.tags.join(", ")}
            onChange={(event) =>
              onChange({
                ...value,
                tags: event.target.value
                  .split(/[,，]/)
                  .map((tag) => tag.trim()),
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}

export function IdeaComposer({
  lists,
  busy,
  sourceCount,
  onGenerate,
  onSave,
  onSaved,
}: {
  lists: LibraryList[];
  busy: boolean;
  sourceCount: (listId: string) => number;
  onGenerate: (
    listId: string,
    method: Idea["method"],
    focus: string,
  ) => Promise<IdeaInput | null>;
  onSave: (
    input: IdeaInput,
    method: Idea["method"],
    sourceListId?: string,
  ) => void;
  onSaved?: () => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"manual" | "automatic">("manual");
  const [input, setInput] = useState<IdeaInput>(emptyInput);
  const [method, setMethod] = useState<Idea["method"]>("combine");
  const [listId, setListId] = useState("");
  const [focus, setFocus] = useState("");
  const [generationFailed, setGenerationFailed] = useState(false);

  const selectedListId = listId || lists[0]?.id || "";

  const reset = () => {
    setInput(emptyInput());
    setFocus("");
    setGenerationFailed(false);
  };
  const save = () => {
    onSave(
      input,
      mode === "manual" ? "capture" : method,
      mode === "automatic" ? selectedListId : undefined,
    );
    onSaved?.();
  };
  const generate = async () => {
    const draft = await onGenerate(selectedListId, method, focus);
    setGenerationFailed(!draft);
    if (draft) setInput(draft);
  };

  return (
    <div>
      <Tabs
        value={mode}
        onChange={(next) => {
          setMode(next);
          reset();
        }}
        items={[
          { value: "manual", label: t("mind.manual") },
          { value: "automatic", label: t("mind.automatic") },
        ]}
      />
      {mode === "automatic" && (
        <div className="mt-4 grid gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900 sm:grid-cols-2">
          <Field label={t("mind.sourceList")}>
            <Select
              value={selectedListId}
              onChange={(event) => setListId(event.target.value)}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({sourceCount(list.id)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("mind.method")}>
            <Select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as Idea["method"])
              }
            >
              {methods.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.label)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("mind.input")}>
            <Input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
            />
          </Field>
          <Button
            className="self-end"
            disabled={!selectedListId || busy}
            onClick={() => void generate()}
          >
            <SparklesIcon className="size-4" />
            {t("mind.run")}
          </Button>
          {generationFailed && (
            <p className="text-sm text-red-600 sm:col-span-2">
              {t("mind.noSources")}
            </p>
          )}
        </div>
      )}
      <div className="mt-5">
        <IdeaFields value={input} onChange={setInput} />
      </div>
      <Button
        className="mt-5"
        disabled={!input.title.trim() || !input.definition.trim()}
        onClick={save}
      >
        {t("mind.create")}
      </Button>
    </div>
  );
}
