import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Missing file." }, { status: 422 });
    if (file.size > 50 * 1024 * 1024)
      return Response.json({ error: "File exceeds 50 MB." }, { status: 413 });
    const rawExtension = path.extname(file.name).slice(1).toLowerCase();
    const extension = /^[a-z0-9]{1,10}$/.test(rawExtension)
      ? rawExtension
      : "bin";
    const fileToken = `${randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), "data", "attachments");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, fileToken),
      new Uint8Array(await file.arrayBuffer()),
    );
    return Response.json({ fileToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
