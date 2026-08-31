export type MarkdownEditorCommand =
  | "bold"
  | "italic"
  | "quote"
  | "highlight"
  | "underline"
  | "code"
  | "latex"
  | "table"
  | "list";

export interface MarkdownSelection {
  start: number;
  end: number;
}
export interface MarkdownCommandResult {
  content: string;
  selection: MarkdownSelection;
}

const placeholders: Record<MarkdownEditorCommand, string> = {
  bold: "text",
  italic: "text",
  quote: "quote",
  highlight: "text",
  underline: "text",
  code: "code",
  latex: "formula",
  table: "",
  list: "item",
};

export function applyMarkdownCommand(
  content: string,
  selection: MarkdownSelection,
  command: MarkdownEditorCommand,
  color = "#FFE066",
): MarkdownCommandResult {
  const selected =
    content.slice(selection.start, selection.end) || placeholders[command];
  const value =
    command === "bold"
      ? `**${selected}**`
      : command === "italic"
        ? `*${selected}*`
        : command === "quote"
          ? selected
              .split("\n")
              .map((line) => `> ${line}`)
              .join("\n")
          : command === "highlight"
            ? `{{highlight:${color}|${selected}}}`
            : command === "underline"
              ? `{{underline:${color}|${selected}}}`
              : command === "code"
                ? `\`\`\`\n${selected}\n\`\`\``
                : command === "latex"
                  ? `$$\n${selected}\n$$`
                  : command === "table"
                    ? "| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |"
                    : selected
                        .split("\n")
                        .map((line) => `- ${line}`)
                        .join("\n");
  const prefix =
    selection.start > 0 &&
    !content.slice(0, selection.start).endsWith("\n") &&
    ["quote", "code", "latex", "table", "list"].includes(command)
      ? "\n"
      : "";
  const replacement = `${prefix}${value}`;
  const next = `${content.slice(0, selection.start)}${replacement}${content.slice(selection.end)}`;
  const start = selection.start + replacement.indexOf(selected);
  return { content: next, selection: { start, end: start + selected.length } };
}
