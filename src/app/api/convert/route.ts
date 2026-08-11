import { PDFParse } from "pdf-parse";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxConversionSize = 20 * 1024 * 1024;
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
    if (file.size > maxConversionSize) {
      const conversionError =
        "PDF saved, but text extraction was skipped because the file exceeds 20 MB.";
      await fs.writeFile(
        path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
        `<!-- ${conversionError} -->\n`,
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
    }
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
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      const content = result.pages
        .map((page) => `<!-- Page ${page.num} -->\n\n${page.text.trim()}`)
        .join("\n\n");
      await fs.writeFile(
        path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
        content,
        "utf8",
      );
      if (!content.trim())
        return Response.json({
          content: "",
          pages: result.total,
          fileToken,
          filePath,
          markdownToken,
          markdownPath,
          conversionError: "No extractable text found.",
        });
      return Response.json({
        content,
        pages: result.total,
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
      await parser.destroy();
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
