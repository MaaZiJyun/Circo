import fs from "node:fs/promises";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ directory: string; image: string }> },
) {
  const { directory, image } = await context.params;
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      directory,
    ) ||
    !/^\d+-\d+\.png$/i.test(image)
  )
    return Response.json({ error: "Invalid image path." }, { status: 400 });
  try {
    const file = await fs.readFile(
      getStoragePath("library", "markdown", directory, image),
    );
    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Disposition": "inline",
        "Content-Type": "image/png",
      },
    });
  } catch {
    return Response.json({ error: "Image not found." }, { status: 404 });
  }
}
