import fs from "node:fs/promises";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tokenPattern = /^[a-f0-9-]+\.(pdf|md|markdown|txt)$/i;

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object")
      return Response.json({ error: "Invalid request." }, { status: 422 });
    const { markdownToken, content } = body as Record<string, unknown>;
    if (
      typeof markdownToken !== "string" ||
      !/^[a-f0-9-]+\.md$/i.test(markdownToken) ||
      typeof content !== "string"
    )
      return Response.json(
        { error: "Invalid Markdown file." },
        { status: 422 },
      );
    if (content.length > 10_000_000)
      return Response.json(
        { error: "Markdown exceeds 10 MB." },
        { status: 413 },
      );
    await fs.writeFile(
      getStoragePath("library", "markdown", markdownToken),
      content,
      "utf8",
    );
    return Response.json({ saved: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Save failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object")
      return Response.json({ error: "Invalid request." }, { status: 422 });
    const { fileToken, markdownToken } = body as Record<string, unknown>;
    const targets: string[] = [];
    const assetDirectoriesToDelete: string[] = [];
    if (typeof fileToken === "string" && tokenPattern.test(fileToken))
      targets.push(getStoragePath("library", fileToken));
    if (typeof markdownToken === "string" && tokenPattern.test(markdownToken))
      targets.push(getStoragePath("library", "markdown", markdownToken));
    if (typeof markdownToken === "string") {
      const identifier = markdownToken.match(/^([a-f0-9-]+)\.md$/i)?.[1];
      if (identifier) {
        const libraryDirectory = getStoragePath("library");
        const imagePattern = new RegExp(
          `^${identifier}-\\d+-\\d+\\.png$`,
          "i",
        );
        const entries = await fs.readdir(libraryDirectory);
        targets.push(
          ...entries
            .filter((entry) => imagePattern.test(entry))
            .map((entry) => getStoragePath("library", entry)),
        );
        const markdownDirectory = getStoragePath("library", "markdown");
        const assetDirectories = await fs.readdir(markdownDirectory, {
          withFileTypes: true,
        });
        for (const assetDirectory of assetDirectories) {
          if (!assetDirectory.isDirectory()) continue;
          const assetPath = getStoragePath(
            "library",
            "markdown",
            assetDirectory.name,
          );
          if (assetDirectory.name.toLowerCase() === identifier.toLowerCase()) {
            assetDirectoriesToDelete.push(assetPath);
            continue;
          }
          const assetFiles = await fs.readdir(assetPath);
          targets.push(
            ...assetFiles
              .filter((entry) => imagePattern.test(entry))
              .map((entry) => getStoragePath(
                "library",
                "markdown",
                assetDirectory.name,
                entry,
              )),
          );
        }
      }
    }
    if (!targets.length)
      return Response.json(
        { error: "No valid files supplied." },
        { status: 422 },
      );
    await Promise.all(targets.map((target) => fs.rm(target, { force: true })));
    await Promise.all(
      assetDirectoriesToDelete.map((target) =>
        fs.rm(target, { force: true, recursive: true }),
      ),
    );
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Delete failed." },
      { status: 400 },
    );
  }
}
