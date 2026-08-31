export const markdownCardKinds = [
  "point",
  "idea",
  "task",
  "project",
  "message",
  "note",
] as const;
export type MarkdownCardKind = (typeof markdownCardKinds)[number];
export interface MarkdownCardReference {
  kind: MarkdownCardKind;
  id: string;
}

const cardPattern =
  /^\[\[card:(point|idea|task|project|message|note):([a-zA-Z0-9_-]+)\]\]$/;

export function parseMarkdownCard(value: string): MarkdownCardReference | null {
  const match = value.trim().match(cardPattern);
  return match ? { kind: match[1] as MarkdownCardKind, id: match[2] } : null;
}

export function markdownCardToken(reference: MarkdownCardReference) {
  return `[[card:${reference.kind}:${reference.id}]]`;
}
