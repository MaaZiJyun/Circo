import fs from "node:fs/promises";
import path from "node:path";
import { getStoragePath } from "@/shared/infrastructure/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const identifier = /^[a-zA-Z0-9_-]{1,160}$/;
const periods = new Set(["day", "week", "month", "year"]);

interface LogPayload {
  projectId: string;
  logId: string;
  period: string;
  type: string;
  content: string;
  nextStep: string;
  tags: string[];
  createdAt: string;
}

const yaml = (value: string) => JSON.stringify(value.replaceAll("\r", ""));

function markdown(payload: LogPayload) {
  return [
    "---",
    `id: ${yaml(payload.logId)}`,
    `projectId: ${yaml(payload.projectId)}`,
    `period: ${yaml(payload.period)}`,
    `type: ${yaml(payload.type)}`,
    `createdAt: ${yaml(payload.createdAt)}`,
    `tags: [${payload.tags.map(yaml).join(", ")}]`,
    "---",
    "",
    `# ${payload.createdAt.slice(0, 10)} · ${payload.period}`,
    "",
    payload.content.trim(),
    ...(payload.nextStep.trim()
      ? ["", "## Next Step", "", payload.nextStep.trim()]
      : []),
    "",
  ].join("\n");
}

async function saveLog(request: Request) {
  try {
    const payload = (await request.json()) as Partial<LogPayload>;
    if (
      !identifier.test(payload.projectId ?? "") ||
      !identifier.test(payload.logId ?? "")
    )
      return Response.json({ error: "Invalid identifier." }, { status: 422 });
    if (!periods.has(payload.period ?? "") || !payload.content?.trim())
      return Response.json({ error: "Invalid log." }, { status: 422 });
    const value: LogPayload = {
      projectId: payload.projectId!,
      logId: payload.logId!,
      period: payload.period!,
      type: payload.type ?? "progress",
      content: payload.content,
      nextStep: payload.nextStep ?? "",
      tags: Array.isArray(payload.tags)
        ? payload.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };
    const directory = getStoragePath("project", value.projectId, "logs");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, `${value.logId}.md`),
      markdown(value),
      "utf8",
    );
    return Response.json({
      filePath: path.posix.join(
        "project",
        value.projectId,
        "logs",
        `${value.logId}.md`,
      ),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save log." },
      { status: 400 },
    );
  }
}

export const POST = saveLog;
export const PUT = saveLog;

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as Partial<LogPayload>;
    if (
      !identifier.test(payload.projectId ?? "") ||
      !identifier.test(payload.logId ?? "")
    )
      return Response.json({ error: "Invalid identifier." }, { status: 422 });
    await fs.rm(
      getStoragePath(
        "project",
        payload.projectId!,
        "logs",
        `${payload.logId}.md`,
      ),
      { force: true },
    );
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete log.",
      },
      { status: 400 },
    );
  }
}
