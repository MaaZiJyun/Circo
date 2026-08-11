export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxInputLength = 5_000;
const maxSegmentBytes = 450;

function splitUtf8(text: string) {
  const encoder = new TextEncoder();
  const segments: string[] = [];
  let segment = "";
  for (const character of text) {
    if (encoder.encode(segment + character).length > maxSegmentBytes) {
      if (segment) segments.push(segment);
      segment = character;
    } else {
      segment += character;
    }
  }
  if (segment) segments.push(segment);
  return segments;
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  responseDetails?: string;
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

    const langpair = target === "zh-CN" ? "en|zh-CN" : "zh-CN|en";
    const translations: string[] = [];
    for (const segment of splitUtf8(text.trim())) {
      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", segment);
      url.searchParams.set("langpair", langpair);
      const response = await fetch(url, { cache: "no-store" });
      const result = (await response.json()) as MyMemoryResponse;
      const translated = result.responseData?.translatedText;
      if (!response.ok || !translated || Number(result.responseStatus) >= 400)
        throw new Error(
          result.responseDetails || "Translation service unavailable.",
        );
      translations.push(translated);
    }
    return Response.json({ translation: translations.join("") });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Translation failed." },
      { status: 502 },
    );
  }
}
