import fs from "node:fs/promises";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tokenPattern = /^[a-f0-9-]+\.(pdf|md|markdown|txt)$/i;

export async function DELETE(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object")
      return Response.json({ error: "Invalid request." }, { status: 422 });
    const { fileToken, markdownToken } = body as Record<string, unknown>;
    const targets: string[] = [];
    if (typeof fileToken === "string" && tokenPattern.test(fileToken))
      targets.push(getStoragePath("library", fileToken));
    if (typeof markdownToken === "string" && tokenPattern.test(markdownToken))
      targets.push(getStoragePath("library", "markdown", markdownToken));
    if (!targets.length)
      return Response.json(
        { error: "No valid files supplied." },
        { status: 422 },
      );
    await Promise.all(targets.map((target) => fs.rm(target, { force: true })));
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Delete failed." },
      { status: 400 },
    );
  }
}
