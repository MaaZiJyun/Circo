import type { ReactNode } from "react";
import katex from "katex";
import {
  parseMarkdownCard,
  type MarkdownCardReference,
} from "../model/markdown-card";
import { MarkdownEntityCard } from "./markdown-entity-card";

type MarkdownBlock =
  | { kind: "line"; value: string; key: number }
  | { kind: "math"; value: string; key: number }
  | { kind: "code"; value: string; language: string; key: number }
  | { kind: "table"; rows: string[][]; key: number }
  | { kind: "card"; reference: MarkdownCardReference; key: number };

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <article className="space-y-3 text-sm leading-7 text-zinc-800 dark:text-zinc-200">
      {markdownBlocks(content).map((block) => (
        <MarkdownBlockView key={block.key} block={block} />
      ))}
    </article>
  );
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.kind === "card")
    return <MarkdownEntityCard reference={block.reference} />;
  if (block.kind === "math") return <MathFormula value={block.value} display />;
  if (block.kind === "code")
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 text-zinc-100 dark:border-zinc-800">
        {block.language && (
          <div className="border-b border-zinc-800 px-4 py-1.5 text-xs text-zinc-400">
            {block.language}
          </div>
        )}
        <pre className="overflow-x-auto p-4 text-sm leading-6">
          <code>{block.value}</code>
        </pre>
      </div>
    );
  if (block.kind === "table") return <MarkdownTable rows={block.rows} />;
  return <MarkdownLine line={block.value} />;
}

function MarkdownLine({ line }: { line: string }) {
  const page = line.match(/^<!-- Page (\d+) -->$/);
  if (page)
    return (
      <div className="my-6 border-b border-zinc-200 pb-1 text-xs text-zinc-400 dark:border-zinc-800">
        Page {page[1]}
      </div>
    );
  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    const className =
      heading[1].length === 1
        ? "text-2xl font-bold"
        : heading[1].length === 2
          ? "text-xl font-semibold"
          : "text-lg font-semibold";
    return <h2 className={className}>{inlineMarkdown(heading[2])}</h2>;
  }
  const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (image)
    return (
      // Extracted images have intrinsic dimensions unavailable in Markdown.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image[2]}
        alt={image[1]}
        loading="lazy"
        className="mx-auto max-h-[36rem] max-w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
      />
    );
  if (/^[-*]\s+/.test(line))
    return (
      <div className="flex gap-2 pl-3">
        <span>•</span>
        <span>{inlineMarkdown(line.replace(/^[-*]\s+/, ""))}</span>
      </div>
    );
  if (/^>\s?/.test(line))
    return (
      <blockquote className="border-l-2 border-zinc-300 pl-4 text-zinc-500">
        {inlineMarkdown(line.replace(/^>\s?/, ""))}
      </blockquote>
    );
  return line ? (
    <p className="whitespace-pre-wrap">{inlineMarkdown(line)}</p>
  ) : (
    <div className="h-2" />
  );
}

function MarkdownTable({ rows }: { rows: string[][] }) {
  const [header, ...body] = rows;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900">
          <tr>
            {header.map((cell, index) => (
              <th
                key={index}
                className="border-r border-zinc-200 px-3 py-2 font-semibold last:border-r-0 dark:border-zinc-700"
              >
                {inlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t border-zinc-200 dark:border-zinc-700"
            >
              {header.map((_, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-r border-zinc-200 px-3 py-2 align-top last:border-r-0 dark:border-zinc-700"
                >
                  {inlineMarkdown(row[cellIndex] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inlineMarkdown(value: string): ReactNode[] {
  const parts = value.split(
    /(\{\{(?:highlight|underline):#[0-9A-Fa-f]{6}\|[^{}\n]*\}\}|\$[^$\n]+\$|\\\([^\n]*?\\\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g,
  );
  return parts.map((part, index) => {
    const decoration = part.match(
      /^\{\{(highlight|underline):(#[0-9A-Fa-f]{6})\|([^{}\n]*)\}\}$/,
    );
    if (decoration)
      return decoration[1] === "highlight" ? (
        <mark
          key={index}
          className="rounded px-0.5 text-inherit"
          style={{ backgroundColor: decoration[2] }}
        >
          {inlineMarkdown(decoration[3])}
        </mark>
      ) : (
        <span
          key={index}
          className="underline decoration-2 underline-offset-2"
          style={{ textDecorationColor: decoration[2] }}
        >
          {inlineMarkdown(decoration[3])}
        </span>
      );
    const dollar = part.match(/^\$([^$\n]+)\$$/);
    const parenthesized = part.match(/^\\\(([^\n]*?)\\\)$/);
    const expression = dollar?.[1] ?? parenthesized?.[1];
    if (expression !== undefined)
      return <MathFormula key={index} value={expression} />;
    const bold = part.match(/^\*\*([^*\n]+)\*\*$/);
    if (bold) return <strong key={index}>{inlineMarkdown(bold[1])}</strong>;
    const italic = part.match(/^\*([^*\n]+)\*$/);
    if (italic) return <em key={index}>{inlineMarkdown(italic[1])}</em>;
    const code = part.match(/^`([^`\n]+)`$/);
    if (code)
      return (
        <code
          key={index}
          className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-zinc-800"
        >
          {code[1]}
        </code>
      );
    return part;
  });
}

function MathFormula({
  value,
  display = false,
}: {
  value: string;
  display?: boolean;
}) {
  return (
    <span
      className={display ? "block overflow-x-auto py-2 text-center" : "inline"}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(value, {
          displayMode: display,
          throwOnError: false,
          strict: "warn",
        }),
      }}
    />
  );
}

function markdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const card = parseMarkdownCard(trimmed);
    if (card) {
      blocks.push({ kind: "card", reference: card, key: index });
      continue;
    }
    const fence = trimmed.match(/^```\s*([^`]*)$/);
    if (fence) {
      const start = index;
      const code: string[] = [];
      while (index + 1 < lines.length && !/^```\s*$/.test(lines[index + 1])) {
        index += 1;
        code.push(lines[index]);
      }
      if (index + 1 < lines.length) index += 1;
      blocks.push({
        kind: "code",
        value: code.join("\n"),
        language: fence[1].trim(),
        key: start,
      });
      continue;
    }
    if (isTableRow(lines[index]) && isTableSeparator(lines[index + 1] ?? "")) {
      const start = index;
      const rows = [tableCells(lines[index])];
      index += 1;
      while (index + 1 < lines.length && isTableRow(lines[index + 1])) {
        index += 1;
        rows.push(tableCells(lines[index]));
      }
      blocks.push({ kind: "table", rows, key: start });
      continue;
    }
    const opening = trimmed.startsWith("$$")
      ? "$$"
      : trimmed.startsWith("\\[")
        ? "\\["
        : null;
    if (!opening) {
      blocks.push({ kind: "line", value: lines[index], key: index });
      continue;
    }
    const start = index;
    const closing = opening === "$$" ? "$$" : "\\]";
    let expression = trimmed.slice(opening.length);
    if (expression.endsWith(closing)) {
      expression = expression.slice(0, -closing.length);
    } else {
      while (index + 1 < lines.length) {
        index += 1;
        const next = lines[index].trim();
        if (next.endsWith(closing)) {
          expression += `\n${next.slice(0, -closing.length)}`;
          break;
        }
        expression += `\n${lines[index]}`;
      }
    }
    blocks.push({ kind: "math", value: expression.trim(), key: start });
  }
  return blocks;
}

function isTableRow(line: string) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isTableSeparator(line: string) {
  return /^\s*\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|\s*$/.test(line);
}

function tableCells(line: string) {
  return line
    .trim()
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll("\\|", "|"));
}
