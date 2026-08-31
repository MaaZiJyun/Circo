import fs from "node:fs/promises";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const identifier = /^[a-zA-Z0-9_-]{1,160}$/;
type Context = { params: Promise<{ noteId: string }> };

export async function GET(_request: Request, context: Context) {
  const { noteId } = await context.params;
  if (!identifier.test(noteId))
    return Response.json(
      { error: "Invalid note identifier." },
      { status: 422 },
    );
  try {
    const content = await fs.readFile(
      getStoragePath("notes", `${noteId}.md`),
      "utf8",
    );
    return Response.json({ content });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return Response.json({ content: "" });
    return Response.json({ error: "Unable to read note." }, { status: 400 });
  }
}

export async function PUT(request: Request, context: Context) {
  const { noteId } = await context.params;
  if (!identifier.test(noteId))
    return Response.json(
      { error: "Invalid note identifier." },
      { status: 422 },
    );
  try {
    const body = (await request.json()) as { content?: unknown };
    if (typeof body.content !== "string")
      return Response.json({ error: "Invalid note." }, { status: 422 });
    if (body.content.length > 10_000_000)
      return Response.json({ error: "Note exceeds 10 MB." }, { status: 413 });
    await fs.mkdir(getStoragePath("notes"), { recursive: true });
    await fs.writeFile(
      getStoragePath("notes", `${noteId}.md`),
      body.content,
      "utf8",
    );
    return Response.json({ saved: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unable to save note.",
      },
      { status: 400 },
    );
  }
}
