import fs from "node:fs/promises";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]+\.(pdf|md|markdown|txt)$/i.test(id)) {
    return Response.json(
      { error: "Invalid file identifier." },
      { status: 400 },
    );
  }
  try {
    let file: Buffer;
    try {
      file = await fs.readFile(getStoragePath("library", id));
    } catch {
      file = await fs.readFile(getStoragePath("files", id));
    }
    const extension = id.split(".").pop()?.toLowerCase();
    const contentType =
      extension === "pdf" ? "application/pdf" : "text/plain; charset=utf-8";
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": contentType, "Content-Disposition": "inline" },
    });
  } catch {
    return Response.json({ error: "File not found." }, { status: 404 });
  }
}
