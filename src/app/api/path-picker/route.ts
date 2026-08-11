import { execFile } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scripts = {
  database:
    'set selectedPath to choose file name with prompt "选择 SQLite 数据库位置 / Select SQLite database location" default name "circo.db"\nPOSIX path of selectedPath',
  storage:
    'set selectedPath to choose folder with prompt "选择文件存储目录 / Select file storage directory"\nPOSIX path of selectedPath',
};

function runPicker(script: string) {
  return new Promise<string>((resolve, reject) => {
    execFile(
      "/usr/bin/osascript",
      ["-e", script],
      { timeout: 120_000, maxBuffer: 4096 },
      (error, stdout, stderr) => {
        if (!error) return resolve(stdout.trim());
        if (stderr.includes("(-128)")) return resolve("");
        reject(new Error(stderr.trim() || error.message));
      },
    );
  });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin)
    return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  if (process.platform !== "darwin")
    return Response.json(
      { error: "Finder path picker is available only on macOS." },
      { status: 501 },
    );
  const kind = requestUrl.searchParams.get("kind");
  if (kind !== "database" && kind !== "storage")
    return Response.json({ error: "Invalid picker type." }, { status: 422 });
  try {
    const selected = await runPicker(scripts[kind]);
    if (!selected) return new Response(null, { status: 204 });
    const selectedPath = path.normalize(selected);
    if (!path.isAbsolute(selectedPath))
      return Response.json({ error: "Finder returned an invalid path." }, { status: 400 });
    return Response.json({ path: selectedPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Finder failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
