import type { ReactNode } from "react";
import katex from "katex";

type MarkdownBlock =
  | { kind: "line"; value: string; key: number }
  | { kind: "math"; value: string; key: number };

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <article className="space-y-3 text-sm leading-7 text-zinc-800 dark:text-zinc-200">
      {markdownBlocks(content).map((block) =>
        block.kind === "math" ? (
          <MathFormula key={block.key} value={block.value} display />
        ) : (
          <MarkdownLine key={block.key} line={block.value} />
        ),
      )}
    </article>
  );
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
    return <h2 className={className}>{inlineMath(heading[2])}</h2>;
  }
  const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (image)
    return (
      // Extracted PDF images have intrinsic dimensions unavailable in Markdown.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image[2]}
        alt={image[1]}
        loading="lazy"
        className="mx-auto max-h-[36rem] max-w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
      />
    );
  if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) return null;
  if (/^\|.*\|$/.test(line)) return <MarkdownTableRow line={line} />;
  if (/^[-*]\s+/.test(line))
    return (
      <div className="flex gap-2 pl-3">
        <span>•</span>
        <span>{inlineMath(line.replace(/^[-*]\s+/, ""))}</span>
      </div>
    );
  if (/^>\s?/.test(line))
    return (
      <blockquote className="border-l-2 border-zinc-300 pl-4 text-zinc-500">
        {inlineMath(line.replace(/^>\s?/, ""))}
      </blockquote>
    );
  return line ? (
    <p className="whitespace-pre-wrap">{inlineMath(line)}</p>
  ) : (
    <div className="h-2" />
  );
}

function MarkdownTableRow({ line }: { line: string }) {
  const cells = line
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll("\\|", "|"));
  return (
    <div
      className="grid min-w-max border-x border-b border-zinc-200 first:border-t dark:border-zinc-700"
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(8rem, 1fr))` }}
    >
      {cells.map((cell, index) => (
        <div
          key={index}
          className="border-r border-zinc-200 px-3 py-1.5 last:border-r-0 dark:border-zinc-700"
        >
          {inlineMath(cell)}
        </div>
      ))}
    </div>
  );
}

function inlineMath(value: string): ReactNode[] {
  const parts = value.split(
    /(\$[^$\n]+\$|\\\([^\n]*?\\\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g,
  );
  return parts.map((part, index) => {
    const dollar = part.match(/^\$([^$\n]+)\$$/);
    const parenthesized = part.match(/^\\\(([^\n]*?)\\\)$/);
    const expression = dollar?.[1] ?? parenthesized?.[1];
    if (expression !== undefined)
      return (
      <MathFormula key={index} value={expression} />
      );
    const bold = part.match(/^\*\*([^*\n]+)\*\*$/);
    if (bold) return <strong key={index}>{inlineMath(bold[1])}</strong>;
    const italic = part.match(/^\*([^*\n]+)\*$/);
    if (italic) return <em key={index}>{inlineMath(italic[1])}</em>;
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
    const opening = trimmed.startsWith("$$")
      ? "$$"
      : trimmed.startsWith("\\[")
        ? "\\["
        : null;
    if (!opening) {
      blocks.push({ kind: "line", value: lines[index], key: index });
      continue;
    }
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
    blocks.push({ kind: "math", value: expression.trim(), key: index });
  }
  return blocks;
}
