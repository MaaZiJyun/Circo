import type { PageTableResult, PageTextResult } from "pdf-parse";

export function pdfAssetUrl(directory: string, image: string) {
  return `/api/markdown-assets/${encodeURIComponent(directory)}/${encodeURIComponent(image)}`;
}

export interface PdfMarkdownAssets {
  images?: Map<number, string[]>;
  tables?: PageTableResult[];
}

const bullet = /^[•●▪◦‣·]\s*/;
const unorderedList = /^[-*+]\s+/;
const orderedList = /^\d+[.)、]\s+/;
const sectionHeading = /^(\d+(?:\.\d+)*\.?)\s+\S/;
const namedHeading = /^(abstract|摘要|introduction|引言|conclusion|结论|references|参考文献|acknowledgements?|致谢)$/i;

function normalizedEdge(line: string) {
  return line.trim().replace(/\s+/g, " ").replace(/\d+/g, "#").toLowerCase();
}

function repeatedPageEdges(pages: PageTextResult[]) {
  const occurrences = new Map<string, Set<number>>();
  for (const page of pages) {
    const lines = page.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const line of [...lines.slice(0, 2), ...lines.slice(-2)]) {
      const key = normalizedEdge(line);
      if (key.length < 3) continue;
      const pageNumbers = occurrences.get(key) ?? new Set<number>();
      pageNumbers.add(page.num);
      occurrences.set(key, pageNumbers);
    }
  }
  const minimum = Math.max(2, Math.ceil(pages.length * 0.6));
  return new Set(
    [...occurrences.entries()]
      .filter(([, pageNumbers]) => pageNumbers.size >= minimum)
      .map(([line]) => line),
  );
}

function headingFor(line: string, firstContent: boolean) {
  if (namedHeading.test(line)) return `## ${line}`;
  const section = line.match(sectionHeading);
  if (section && line.length <= 120) {
    const depth = Math.min(3, section[1].split(".").filter(Boolean).length + 1);
    return `${"#".repeat(depth)} ${line}`;
  }
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 4 && line.length <= 90 && line === line.toUpperCase())
    return `## ${line}`;
  if (firstContent && line.length >= 4 && line.length <= 140)
    return `# ${line}`;
  return null;
}

function markdownTable(rows: string[][]) {
  const width = Math.max(...rows.map((row) => row.length));
  const padded = rows.map((row) => [
    ...row,
    ...Array<string>(width - row.length).fill(""),
  ]);
  const render = (row: string[]) =>
    `| ${row.map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`;
  return [
    render(padded[0]),
    render(Array<string>(width).fill("---")),
    ...padded.slice(1).map(render),
  ].join("\n");
}

function joinParagraph(lines: string[]) {
  return lines.reduce((paragraph, line) => {
    if (!paragraph) return line;
    if (/[A-Za-z]-$/.test(paragraph) && /^[a-z]/.test(line))
      return paragraph.slice(0, -1) + line;
    return `${paragraph} ${line}`;
  }, "");
}

function convertPage(
  page: PageTextResult,
  repeatedEdges: Set<string>,
  firstDocumentContent: boolean,
) {
  const output: string[] = [];
  let paragraph: string[] = [];
  let table: string[] = [];
  let firstContent = firstDocumentContent;
  const flushParagraph = () => {
    if (paragraph.length) output.push(joinParagraph(paragraph));
    paragraph = [];
  };
  const flushTable = () => {
    if (table.length)
      output.push(
        markdownTable(
          table.map((line) => line.split("\t").map((cell) => cell.trim())),
        ),
      );
    table = [];
  };

  for (const rawLine of page.text.replaceAll("\u0000", "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushTable();
      continue;
    }
    if (/^(page\s*)?\d+(\s*(of|\/)\s*\d+)?$/i.test(line)) continue;
    if (repeatedEdges.has(normalizedEdge(line))) continue;
    if (line.includes("\t") && line.split("\t").filter(Boolean).length >= 2) {
      flushParagraph();
      table.push(line);
      firstContent = false;
      continue;
    }
    flushTable();
    const heading = headingFor(line, firstContent);
    if (heading) {
      flushParagraph();
      output.push(heading);
    } else if (bullet.test(line)) {
      flushParagraph();
      output.push(`- ${line.replace(bullet, "")}`);
    } else if (unorderedList.test(line) || orderedList.test(line)) {
      flushParagraph();
      output.push(line);
    } else {
      paragraph.push(line);
    }
    firstContent = false;
  }
  flushParagraph();
  flushTable();
  return output.join("\n\n");
}

function extractedTables(page: PageTableResult | undefined, content: string) {
  if (!page) return [];
  return page.tables
    .filter((table) => table.length >= 2 && table.some((row) => row.length >= 2))
    .filter((table) => !content.includes(markdownTable(table).split("\n")[0]))
    .map(markdownTable);
}

export function pdfTextToMarkdown(
  pages: PageTextResult[],
  assets: PdfMarkdownAssets = {},
) {
  const repeatedEdges = repeatedPageEdges(pages);
  const tables = new Map(assets.tables?.map((page) => [page.num, page]));
  let hasDocumentContent = false;
  return pages
    .map((page) => {
      const body = convertPage(page, repeatedEdges, !hasDocumentContent);
      const additions = [
        ...extractedTables(tables.get(page.num), body),
        ...(assets.images?.get(page.num) ?? []).map(
          (source, index) => `![Page ${page.num} image ${index + 1}](${source})`,
        ),
      ];
      const content = [body, ...additions].filter(Boolean).join("\n\n");
      if (content) hasDocumentContent = true;
      return `<!-- Page ${page.num} -->${content ? `\n\n${content}` : ""}`;
    })
    .join("\n\n")
    .trim()
    .concat("\n");
}
