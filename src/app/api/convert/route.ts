import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStoragePath } from "@/shared/infrastructure/storage-config";
import { convertPdfWithMineru } from "@/modules/find/server/mineru-converter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxUploadSize = 200 * 1024 * 1024;
type ConversionPayload = {
  content: string;
  pages: number;
  fileToken: string;
  filePath: string;
  markdownToken: string;
  markdownPath: string;
  degraded?: boolean;
  conversionWarning?: string;
  conversionDiagnostic?: string;
  conversionError?: string;
};
type ConversionJob =
  | { status: "processing" }
  | { status: "complete"; result: ConversionPayload };

const conversionJobs = new Map<string, ConversionJob>();
const conversionJobRetentionMs = 60 * 60 * 1000;

function completeJob(jobId: string, result: ConversionPayload) {
  conversionJobs.set(jobId, { status: "complete", result });
  const cleanup = setTimeout(
    () => conversionJobs.delete(jobId),
    conversionJobRetentionMs,
  );
  cleanup.unref();
}

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId") ?? "";
  if (!/^[a-f0-9-]+$/i.test(jobId))
    return Response.json({ error: "Invalid conversion job." }, { status: 422 });
  const job = conversionJobs.get(jobId);
  if (!job)
    return Response.json(
      { error: "Conversion job was not found or has expired." },
      { status: 404 },
    );
  if (job.status === "processing")
    return Response.json({ jobId, status: job.status }, { status: 202 });
  return Response.json({ jobId, status: job.status, ...job.result });
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
    const temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "circo-mineru-"),
    );
    const jobId = randomUUID();
    conversionJobs.set(jobId, { status: "processing" });
    void convertPdfJob({
      jobId,
      identifier,
      inputPath: path.join(/* turbopackIgnore: true */ directory, fileToken),
      temporaryDirectory,
      markdownDirectory,
      markdownToken,
      base: { fileToken, filePath, markdownToken, markdownPath },
    });
    return Response.json({ jobId, status: "processing" }, { status: 202 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}

async function convertPdfJob({
  jobId,
  identifier,
  inputPath,
  temporaryDirectory,
  markdownDirectory,
  markdownToken,
  base,
}: {
  jobId: string;
  identifier: string;
  inputPath: string;
  temporaryDirectory: string;
  markdownDirectory: string;
  markdownToken: string;
  base: Pick<
    ConversionPayload,
    "fileToken" | "filePath" | "markdownToken" | "markdownPath"
  >;
}) {
  try {
    const result = await convertPdfWithMineru(
      inputPath,
      temporaryDirectory,
      markdownDirectory,
      identifier,
    );
    await fs.writeFile(
      path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
      result.content,
      "utf8",
    );
    if (result.degraded)
      console.warn("PDF conversion completed in degraded mode", {
        identifier,
        diagnostic: result.diagnostic,
      });
    completeJob(jobId, {
      ...base,
      content: result.content,
      pages: result.pages,
      degraded: result.degraded,
      conversionWarning: result.warning,
      conversionDiagnostic: result.diagnostic,
    });
  } catch (error) {
    const conversionError =
      error instanceof Error ? error.message : "Conversion failed.";
    console.error("PDF conversion failed", { identifier, conversionError });
    await fs.writeFile(
      path.join(/* turbopackIgnore: true */ markdownDirectory, markdownToken),
      `<!-- PDF conversion failed: ${conversionError.replaceAll("--", "—")} -->\n`,
      "utf8",
    );
    completeJob(jobId, {
      ...base,
      content: "",
      pages: 0,
      conversionError,
    });
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}
