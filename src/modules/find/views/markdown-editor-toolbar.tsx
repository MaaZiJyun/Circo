"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import {
  applyMarkdownCommand,
  type MarkdownEditorCommand,
  type MarkdownSelection,
} from "../model/markdown-editor-command";

const commands: Array<{ command: MarkdownEditorCommand; symbol: string }> = [
  { command: "bold", symbol: "B" },
  { command: "italic", symbol: "I" },
  { command: "quote", symbol: "❝" },
  { command: "code", symbol: "</>" },
  { command: "latex", symbol: "Σ" },
  { command: "table", symbol: "▦" },
  { command: "list", symbol: "☷" },
];

const colorPalette = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Green", value: "#22C55E" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
] as const;

export function MarkdownEditorToolbar({
  value,
  getSelection,
  onChange,
}: {
  value: string;
  getSelection: () => MarkdownSelection;
  onChange: (value: string, selection: MarkdownSelection) => void;
}) {
  const { t } = useI18n();
  const [highlight, setHighlight] = useState("#EAB308");
  const [underline, setUnderline] = useState("#3B82F6");
  const apply = (command: MarkdownEditorCommand, color?: string) => {
    const result = applyMarkdownCommand(value, getSelection(), command, color);
    onChange(result.content, result.selection);
  };
  return (
    <div className="flex flex-wrap items-center gap-1">
      {commands.slice(0, 3).map((item) => (
        <ToolButton
          key={item.command}
          {...item}
          label={t(`find.markdownTool.${item.command}`)}
          onClick={() => apply(item.command)}
        />
      ))}
      <ColorTool
        command="highlight"
        symbol="H"
        color={highlight}
        label={t("find.markdownTool.highlight")}
        onColor={setHighlight}
        onClick={() => apply("highlight", highlight)}
      />
      <ColorTool
        command="underline"
        symbol="U"
        color={underline}
        label={t("find.markdownTool.underline")}
        onColor={setUnderline}
        onClick={() => apply("underline", underline)}
      />
      {commands.slice(3).map((item) => (
        <ToolButton
          key={item.command}
          {...item}
          label={t(`find.markdownTool.${item.command}`)}
          onClick={() => apply(item.command)}
        />
      ))}
    </div>
  );
}

function ToolButton({
  symbol,
  label,
  onClick,
}: {
  command: MarkdownEditorCommand;
  symbol: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      title={label}
      aria-label={label}
      className="min-h-8 min-w-8 px-2 font-mono text-xs"
      onClick={onClick}
    >
      {symbol}
    </Button>
  );
}

function ColorTool({
  command,
  symbol,
  color,
  label,
  onColor,
  onClick,
}: {
  command: MarkdownEditorCommand;
  symbol: string;
  color: string;
  label: string;
  onColor: (value: string) => void;
  onClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900">
      <ToolButton
        command={command}
        symbol={symbol}
        label={label}
        onClick={onClick}
      />
      <button
        type="button"
        className="mr-1 grid size-6 cursor-pointer place-items-center"
        title={`${label} color: ${color}`}
        aria-label={`${label} color: ${color}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className="size-4 rounded-full border border-black/15"
          style={{ backgroundColor: color }}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 flex gap-1 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          {colorPalette.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${
                color === item.value
                  ? "border-zinc-950 ring-2 ring-zinc-300 dark:border-white dark:ring-zinc-700"
                  : "border-white dark:border-zinc-950"
              }`}
              style={{ backgroundColor: item.value }}
              title={`${label}: ${item.name}`}
              aria-label={`${label}: ${item.name}`}
              aria-pressed={color === item.value}
              onClick={() => {
                onColor(item.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
