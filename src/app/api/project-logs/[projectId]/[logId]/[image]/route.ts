import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const identifier = /^[a-zA-Z0-9_-]{1,160}$/;
const imageIdentifier = /^[a-f0-9-]+\.(png|jpe?g|webp|gif)$/i;
const imageExtensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

type Context = {
  params: Promise<{ projectId: string; logId: string; image: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { projectId, logId } = await context.params;
    if (!identifier.test(projectId) || !identifier.test(logId))
      return Response.json({ error: "Invalid log identifier." }, { status: 422 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Missing image." }, { status: 422 });
    const extension = imageExtensions[file.type];
    if (!extension)
      return Response.json({ error: "Unsupported image type." }, { status: 415 });
    if (file.size > 10 * 1024 * 1024)
      return Response.json({ error: "Image exceeds 10 MB." }, { status: 413 });
    const image = `${randomUUID()}.${extension}`;
    const directory = getStoragePath("project", projectId, "logs", logId);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(/* turbopackIgnore: true */ directory, image),
      new Uint8Array(await file.arrayBuffer()),
    );
    return Response.json({
      image,
      url: `/api/project-logs/${encodeURIComponent(projectId)}/${encodeURIComponent(logId)}/${image}`,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}

export async function GET(_request: Request, context: Context) {
  const { projectId, logId, image } = await context.params;
  if (
    !identifier.test(projectId) ||
    !identifier.test(logId) ||
    !imageIdentifier.test(image)
  )
    return Response.json({ error: "Invalid image identifier." }, { status: 422 });
  try {
    const file = await fs.readFile(
      getStoragePath("project", projectId, "logs", logId, image),
    );
    const extension = image.split(".").pop()?.toLowerCase();
    const contentType =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : extension === "gif"
            ? "image/gif"
            : "image/jpeg";
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ error: "Image not found." }, { status: 404 });
  }
}
