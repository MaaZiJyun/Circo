import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Missing image." }, { status: 422 });
    if (!new Set(["image/png", "image/jpeg"]).has(file.type))
      return Response.json(
        { error: "Only PNG and JPEG are supported." },
        { status: 415 },
      );
    if (file.size > 10 * 1024 * 1024)
      return Response.json({ error: "Image exceeds 10 MB." }, { status: 413 });
    const extension = file.type === "image/png" ? "png" : "jpg";
    const token = `${randomUUID()}.${extension}`;
    const directory = getStoragePath("reference");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(/* turbopackIgnore: true */ directory, token),
      new Uint8Array(await file.arrayBuffer()),
    );
    return Response.json({ token, contentPath: path.join("reference", token) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
