import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getBackgroundMusicPath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const audioExtensions: Record<string, string> = {
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
};

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Missing audio file." }, { status: 422 });
    const extension = audioExtensions[file.type];
    if (!extension)
      return Response.json(
        { error: "Only MP3 files are supported." },
        { status: 415 },
      );
    if (file.size > 50 * 1024 * 1024)
      return Response.json({ error: "Audio exceeds 50 MB." }, { status: 413 });
    const token = `${randomUUID()}.${extension}`;
    const directory = getBackgroundMusicPath();
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(/* turbopackIgnore: true */ directory, token),
      new Uint8Array(await file.arrayBuffer()),
    );
    return Response.json({ token, name: file.name.slice(0, 200) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
