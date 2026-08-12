import fs from "node:fs/promises";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]+\.(png|jpg)$/i.test(id))
    return Response.json({ error: "Invalid image." }, { status: 400 });
  try {
    const file = await fs.readFile(getStoragePath("reference", id));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": id.endsWith(".png") ? "image/png" : "image/jpeg",
      },
    });
  } catch {
    return Response.json({ error: "Image not found." }, { status: 404 });
  }
}
