export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { translateLocally } from "@/server/local-translator";

const maxInputLength = 5_000;
const maxSegmentLength = 400;

function splitText(text: string) {
  const segments: string[] = [];
  for (const paragraph of text.split(/(\n+)/)) {
    if (!paragraph || /^\n+$/.test(paragraph)) {
      if (paragraph) segments.push(paragraph);
      continue;
    }
    for (let offset = 0; offset < paragraph.length; offset += maxSegmentLength)
      segments.push(paragraph.slice(offset, offset + maxSegmentLength));
  }
  return segments;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object")
      return Response.json({ error: "Invalid request." }, { status: 422 });
    const { text, target } = body as Record<string, unknown>;
    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > maxInputLength
    )
      return Response.json(
        { error: "Select between 1 and 5,000 characters." },
        { status: 422 },
      );
    if (target !== "zh-CN" && target !== "en")
      return Response.json(
        { error: "Unsupported target language." },
        { status: 422 },
      );

    const translations: string[] = [];
    for (const segment of splitText(text.trim())) {
      translations.push(
        /^\n+$/.test(segment)
          ? segment
          : await translateLocally(segment, target),
      );
    }
    return Response.json({ translation: translations.join("") });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Translation failed." },
      { status: 502 },
    );
  }
}
