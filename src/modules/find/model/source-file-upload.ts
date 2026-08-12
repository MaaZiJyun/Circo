import type { SourceRecord } from "@/shared/model/entities";

interface ConversionResult {
  content?: string;
  fileToken?: string;
  filePath?: string;
  markdownToken?: string;
  markdownPath?: string;
  conversionError?: string;
  error?: string;
}

export async function uploadSourceFile(
  file: File,
): Promise<Partial<SourceRecord>> {
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/convert", { method: "POST", body: form });
  const result = (await response.json()) as ConversionResult;
  if (!response.ok) throw new Error(result.error || "Upload failed.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  return {
    fileName: file.name,
    fileType: extension === "pdf" ? "pdf" : "markdown",
    content: result.content ?? "",
    fileToken: result.fileToken ?? "",
    filePath: result.filePath ?? "",
    markdownToken: result.markdownToken ?? "",
    markdownPath: result.markdownPath ?? "",
    conversionStatus: result.conversionError ? "failed" : "ready",
    conversionMessage: result.conversionError ?? "",
  };
}
