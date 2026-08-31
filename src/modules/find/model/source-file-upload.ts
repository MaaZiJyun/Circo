import type { SourceRecord } from "@/shared/model/entities";

interface ConversionResult {
  jobId?: string;
  status?: "processing" | "complete";
  content?: string;
  fileToken?: string;
  filePath?: string;
  markdownToken?: string;
  markdownPath?: string;
  conversionError?: string;
  conversionWarning?: string;
  conversionDiagnostic?: string;
  degraded?: boolean;
  error?: string;
}

export async function uploadSourceFile(
  file: File,
): Promise<Partial<SourceRecord>> {
  const form = new FormData();
  form.set("file", file);
  let response: Response;
  try {
    response = await fetch("/api/convert", { method: "POST", body: form });
  } catch (error) {
    throw new Error(conversionRequestError(error));
  }
  let result = (await response.json()) as ConversionResult;
  if (!response.ok) throw new Error(result.error || "Upload failed.");
  if (result.jobId) result = await waitForConversion(result.jobId);
  const extension = file.name.split(".").pop()?.toLowerCase();
  return {
    fileName: file.name,
    fileType: extension === "pdf" ? "pdf" : "markdown",
    content: result.content ?? "",
    fileToken: result.fileToken ?? "",
    filePath: result.filePath ?? "",
    markdownToken: result.markdownToken ?? "",
    markdownPath: result.markdownPath ?? "",
    conversionStatus: result.conversionError
      ? "failed"
      : result.degraded
        ? "degraded"
        : "ready",
    conversionMessage:
      result.conversionError ??
      [result.conversionWarning, result.conversionDiagnostic]
        .filter(Boolean)
        .join("\n\n"),
  };
}

const conversionPollIntervalMs = 1_000;
const conversionPollTimeoutMs = 31 * 60 * 1_000;

async function waitForConversion(jobId: string) {
  const deadline = Date.now() + conversionPollTimeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, conversionPollIntervalMs));
    let response: Response;
    try {
      response = await fetch(
        `/api/convert?jobId=${encodeURIComponent(jobId)}`,
        { cache: "no-store" },
      );
    } catch (error) {
      throw new Error(conversionRequestError(error));
    }
    const result = (await response.json()) as ConversionResult;
    if (!response.ok)
      throw new Error(result.error || "Unable to read conversion status.");
    if (response.status !== 202 && result.status === "complete") return result;
  }
  throw new Error("PDF conversion status timed out after 31 minutes.");
}

export function conversionRequestError(error: unknown) {
  const message = error instanceof Error ? error.message : "Conversion failed.";
  if (/^(load failed|failed to fetch)$/i.test(message.trim()))
    return "PDF 转换连接意外中断。MinerU 子进程或 Circo 后台服务可能已退出；请确认 Settings → Modules 中的模块状态后重试。";
  return message;
}
