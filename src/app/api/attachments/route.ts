import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  const filePath = localPath(new URL(request.url).searchParams.get("path"));
  if (!filePath)
    return Response.json({ error: "Invalid file path." }, { status: 422 });
  try {
    const file = await fs.readFile(/* turbopackIgnore: true */ filePath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(path.basename(filePath))}`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "File not found." }, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: unknown };
    const filePath = localPath(body.path);
    if (!filePath)
      return Response.json({ error: "Invalid file path." }, { status: 422 });
    const stat = await fs.stat(/* turbopackIgnore: true */ filePath);
    if (!stat.isFile())
      return Response.json({ error: "The selected path is not a file." }, { status: 422 });
    return Response.json({
      filePath,
      name: path.basename(filePath),
      size: stat.size,
      mimeType: contentTypes[path.extname(filePath).toLowerCase()]?.split(";")[0] ?? "application/octet-stream",
    });
  } catch {
    return Response.json({ error: "File not found." }, { status: 404 });
  }
}

export async function PUT(request: Request) {
  if (process.platform !== "darwin")
    return Response.json({ error: "This action is available only on macOS." }, { status: 501 });
  const body = (await request.json()) as { path?: unknown; action?: unknown };
  const filePath = localPath(body.path);
  if (!filePath || (body.action !== "open" && body.action !== "reveal"))
    return Response.json({ error: "Invalid action." }, { status: 422 });
  const args = body.action === "reveal" ? ["-R", filePath] : [filePath];
  return new Promise<Response>((resolve) => {
    execFile("/usr/bin/open", args, (error) =>
      resolve(error
        ? Response.json({ error: error.message }, { status: 500 })
        : Response.json({ opened: true })),
    );
  });
}
