import { PDFParse } from "pdf-parse";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStoragePath } from "@/shared/infrastructure/storage-config";
import {
  pdfAssetUrl,
  pdfTextToMarkdown,
} from "@/modules/find/model/pdf-converter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxUploadSize = 200 * 1024 * 1024;
const maxExtractedImages = 40;
const maxExtractedImageBytes = 50 * 1024 * 1024;

async function savePdfImages(
  parser: PDFParse,
  identifier: string,
  markdownDirectory: string,
) {
  const result = await parser.getImage({
    imageBuffer: true,
    imageDataUrl: false,
    imageThreshold: 120,
  });
  const images = new Map<number, string[]>();
  let count = 0;
  let totalBytes = 0;
  const assetDirectory = identifier;
  const assetPath = path.join(markdownDirectory, assetDirectory);
  for (const page of result.pages) {
    for (const image of page.images) {
      if (
        !image.data.length ||
        count >= maxExtractedImages ||
        totalBytes + image.data.length > maxExtractedImageBytes
      )
        continue;
      count += 1;
      totalBytes += image.data.length;
      const token = `${page.pageNumber}-${count}.png`;
      await fs.mkdir(assetPath, { recursive: true });
      await fs.writeFile(
        path.join(/* turbopackIgnore: true */ assetPath, token),
        image.data,
      );
      const pageImages = images.get(page.pageNumber) ?? [];
      pageImages.push(pdfAssetUrl(assetDirectory, token));
      images.set(page.pageNumber, pageImages);
    }
  }
  return images;
}

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
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText({
        cellSeparator: "\t",
        lineEnforce: true,
        pageJoiner: "",
        parseHyperlinks: true,
      });
      const tables = await parser.getTable();
      const images = await savePdfImages(
        parser,
        identifier,
        markdownDirectory,
      );
      const hasExtractableContent =
        result.pages.some((page) => page.text.trim()) || images.size > 0;
      const content = pdfTextToMarkdown(result.pages, {
        images,
        tables: tables.pages,
      });
      await fs.writeFile(
        path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
        content,
        "utf8",
      );
      if (!hasExtractableContent)
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
