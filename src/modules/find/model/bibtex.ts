export interface CitationMetadata {
  title: string;
  authors: string;
  origin: string;
  category: string;
  tags: string[];
  publicationDate: string;
}

interface BibTeXEntry {
  type: string;
  fields: Record<string, string>;
}

const unknown = "unknown";

function readValue(body: string, start: number) {
  const opening = body[start];
  if (opening === "{") {
    let depth = 0;
    for (let index = start; index < body.length; index += 1) {
      if (body[index] === "{") depth += 1;
      if (body[index] === "}") depth -= 1;
      if (depth === 0)
        return { value: body.slice(start + 1, index), end: index + 1 };
    }
    throw new Error("Unclosed BibTeX field value.");
  }
  if (opening === '"') {
    const end = body.indexOf('"', start + 1);
    if (end < 0) throw new Error("Unclosed BibTeX quoted value.");
    return { value: body.slice(start + 1, end), end: end + 1 };
  }
  const end = body.indexOf(",", start);
  return {
    value: body.slice(start, end < 0 ? body.length : end).trim(),
    end: end < 0 ? body.length : end,
  };
}

export function parseBibTeX(citation: string): BibTeXEntry {
  const match = citation
    .trim()
    .match(/^@([a-z]+)\s*\{\s*[^,]+,([\s\S]*)\}\s*$/i);
  if (!match) throw new Error("Citation must be a BibTeX entry.");
  const body = match[2];
  const fields: Record<string, string> = {};
  let cursor = 0;
  while (cursor < body.length) {
    while (/[,\s]/.test(body[cursor] ?? "")) cursor += 1;
    if (cursor >= body.length) break;
    const keyMatch = body.slice(cursor).match(/^([a-z][\w-]*)\s*=\s*/i);
    if (!keyMatch) throw new Error("Invalid BibTeX field.");
    cursor += keyMatch[0].length;
    const parsed = readValue(body, cursor);
    fields[keyMatch[1].toLowerCase()] = parsed.value.trim();
    cursor = parsed.end;
  }
  return { type: match[1].toLowerCase(), fields };
}

export function citationMetadata(citation: string): CitationMetadata {
  if (!citation.trim())
    return {
      title: unknown,
      authors: unknown,
      origin: unknown,
      category: unknown,
      tags: [unknown],
      publicationDate: unknown,
    };
  const entry = parseBibTeX(citation);
  const keywords = entry.fields.keywords
    ?.split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    title: entry.fields.title || unknown,
    authors: entry.fields.author?.replace(/\s+and\s+/gi, ", ") || unknown,
    origin:
      entry.fields.booktitle ||
      entry.fields.journal ||
      entry.fields.publisher ||
      unknown,
    category: entry.type || unknown,
    tags: keywords?.length ? [...new Set(keywords)] : [unknown],
    publicationDate: entry.fields.year || entry.fields.date || unknown,
  };
}
