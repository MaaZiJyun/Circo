import {
  getStorageConfig,
  saveStorageConfig,
} from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    directory: getStorageConfig().backgroundMusicDirectory,
  });
}

export async function PUT(request: Request) {
  try {
    const value: unknown = await request.json();
    if (
      !value ||
      typeof value !== "object" ||
      !("directory" in value) ||
      typeof value.directory !== "string"
    )
      return Response.json({ error: "Invalid music directory." }, { status: 422 });
    const current = getStorageConfig();
    const saved = saveStorageConfig({
      ...current,
      backgroundMusicDirectory: value.directory,
    });
    return Response.json({ directory: saved.backgroundMusicDirectory });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save music directory.";
    return Response.json({ error: message }, { status: 400 });
  }
}
