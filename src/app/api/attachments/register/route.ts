import fs from "node:fs/promises";
import path from "node:path";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const identifier = /^[a-zA-Z0-9_-]{1,160}$/;

const contentTypes: Record<string, string> = {
  ".csv": "text/csv; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".md": "text/markdown; charset=utf-8",
  ".markdown": "text/markdown; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

function localPath(value: unknown) {
  if (typeof value !== "string" || !path.isAbsolute(value)) return null;
  return path.normalize(value);
}

/** 返回一个不存在的目标路径，避免同名文件相互覆盖。 */
async function availablePath(directory: string, name: string): Promise<string> {
  const extension = path.extname(name);
  const base = name.slice(0, name.length - extension.length);
  let candidate = path.join(directory, name);
  let index = 1;
  while (true) {
    try {
      await fs.access(candidate);
    } catch {
      return candidate;
    }
    candidate = path.join(directory, `${base} (${index})${extension}`);
    index += 1;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: unknown; projectId?: unknown };
    const sourcePath = localPath(body.path);
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    if (!sourcePath || !identifier.test(projectId))
      return Response.json({ error: "Invalid attachment." }, { status: 422 });
    const stat = await fs.stat(/* turbopackIgnore: true */ sourcePath);
    if (!stat.isFile())
      return Response.json(
        { error: "The selected path is not a file." },
        { status: 422 },
      );
    const directory = getStoragePath("project", projectId, "attachment");
    await fs.mkdir(directory, { recursive: true });
    const destination = await availablePath(directory, path.basename(sourcePath));
    await fs.copyFile(sourcePath, destination);
    const extension = path.extname(destination).toLowerCase();
    return Response.json({
      filePath: destination,
      name: path.basename(destination),
      size: stat.size,
      mimeType:
        contentTypes[extension]?.split(";")[0] ?? "application/octet-stream",
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to register attachment.",
      },
      { status: 400 },
    );
  }
}
