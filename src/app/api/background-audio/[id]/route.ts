import fs from "node:fs/promises";
import { getBackgroundMusicPath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  webm: "audio/webm",
};

function validToken(value: string) {
  return /^[a-f0-9-]+\.(aac|flac|m4a|mp3|ogg|wav|webm)$/i.test(value);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!validToken(id))
    return Response.json({ error: "Invalid audio file." }, { status: 400 });
  try {
    const file = await fs.readFile(getBackgroundMusicPath(id));
    const range = request.headers.get("range")?.match(/bytes=(\d+)-(\d*)/);
    const extension = id.split(".").pop()?.toLowerCase() ?? "";
    const headers = {
      "Accept-Ranges": "bytes",
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    };
    if (!range) return new Response(new Uint8Array(file), { headers });
    const start = Number(range[1]);
    const requestedEnd = range[2] ? Number(range[2]) : file.length - 1;
    const end = Math.min(requestedEnd, file.length - 1);
    if (start >= file.length || start > end)
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${file.length}` },
      });
    return new Response(new Uint8Array(file.subarray(start, end + 1)), {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${file.length}`,
      },
    });
  } catch {
    return Response.json({ error: "Audio not found." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!validToken(id))
    return Response.json({ error: "Invalid audio file." }, { status: 400 });
  await fs.rm(getBackgroundMusicPath(id), { force: true });
  return Response.json({ ok: true });
}
