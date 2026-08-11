import fs from "node:fs/promises";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]+\.[a-z0-9]{1,10}$/i.test(id))
    return Response.json(
      { error: "Invalid file identifier." },
      { status: 400 },
    );
  try {
    const file = await fs.readFile(getStoragePath("attachments", id));
    return new Response(file, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${id}"`,
      },
    });
  } catch {
    return Response.json({ error: "File not found." }, { status: 404 });
  }
}
