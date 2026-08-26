import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStoragePath } from "@/shared/infrastructure/storage-config";
import { convertPdfWithMineru } from "@/modules/find/server/mineru-converter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxUploadSize = 200 * 1024 * 1024;
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Missing file." }, { status: 422 });
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["md", "markdown", "txt", "pdf"].includes(extension ?? "")) {
      return Response.json(
        { error: "Unsupported file type." },
        { status: 415 },
      );
    }
    if (file.size > maxUploadSize)
      return Response.json({ error: "File exceeds 200 MB." }, { status: 413 });
    const identifier = randomUUID();
    const fileToken = `${identifier}.${extension ?? "bin"}`;
    const markdownToken = `${identifier}.md`;
    const directory = getStoragePath("library");
    const markdownDirectory = getStoragePath("library", "markdown");
    await Promise.all([
      fs.mkdir(directory, { recursive: true }),
      fs.mkdir(markdownDirectory, { recursive: true }),
    ]);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await fs.writeFile(
      path.join(/* turbopackIgnore: true */ directory, fileToken),
      bytes,
    );
    const filePath = path.join("library", fileToken);
    const markdownPath = path.join("library", "markdown", markdownToken);
    if (extension === "md" || extension === "markdown" || extension === "txt") {
      const content = new TextDecoder().decode(bytes);
      await fs.writeFile(
        path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
        content,
        "utf8",
      );
      return Response.json({
        content,
        pages: 1,
        fileToken,
        filePath,
        markdownToken,
        markdownPath,
      });
    }
    const temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "circo-mineru-"),
    );
    try {
      const result = await convertPdfWithMineru(
        path.join(/* turbopackIgnore: true */ directory, fileToken),
        temporaryDirectory,
        markdownDirectory,
        identifier,
      );
      await fs.writeFile(
        path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
        result.content,
        "utf8",
      );
      return Response.json({
        content: result.content,
        pages: result.pages,
        fileToken,
        filePath,
        markdownToken,
        markdownPath,
      });
    } catch (error) {
      const conversionError =
        error instanceof Error ? error.message : "Conversion failed.";
      await fs.writeFile(
        path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
        `<!-- PDF conversion failed: ${conversionError.replaceAll("--", "—")} -->\n`,
        "utf8",
      );
      return Response.json({
        content: "",
        pages: 0,
        fileToken,
        filePath,
        markdownToken,
        markdownPath,
        conversionError,
      });
    } finally {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
