import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { getMineruPaths } from "@/shared/infrastructure/external-modules";

const conversionTimeoutMs = 30 * 60 * 1000;
const markdownImage = /(!\[[^\]]*\]\()([^)\s]+)([^)]*\))/g;

export interface MineruConversionResult {
  content: string;
  pages: number;
}

function mineruCommand() {
  return getMineruPaths().command || process.env.MINERU_COMMAND?.trim() || "";
}

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

async function mineruEnvironment(outputPath: string) {
  const configured = getMineruPaths();
  const command = mineruCommand();
  if (!command)
    throw new Error(
      "MinerU module is not configured. Choose a Circo modules directory in Settings.",
    );
  if (!configured.command) return { command, env: process.env };
  try {
    await fs.access(configured.command);
    await fs.access(
      path.join(/* turbopackIgnore: true */ configured.models, "models"),
    );
  } catch {
    throw new Error(
      "MinerU module is incomplete. Expected mineru/mineru and mineru/models/pipeline in the selected modules directory.",
    );
  }
  const configPath = path.join(outputPath, "mineru.json");
  await fs.writeFile(
    configPath,
    JSON.stringify({
      "model-source": "local",
      "models-dir": { pipeline: configured.models, vlm: "" },
    }),
    "utf8",
  );
  return {
    command,
    env: {
      ...process.env,
      MINERU_MODEL_SOURCE: "local",
      MINERU_TOOLS_CONFIG_JSON: configPath,
    },
  };
}

async function runMineru(inputPath: string, outputPath: string) {
  const execution = await mineruEnvironment(outputPath);
  return new Promise<void>((resolve, reject) => {
    const child = spawn(/* turbopackIgnore: true */
      execution.command,
      [
        "-p",
        inputPath,
        "-o",
        outputPath,
        "-m",
        "auto",
        "-b",
        "pipeline",
      ],
      { env: execution.env, stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("MinerU conversion timed out after 30 minutes."));
    }, conversionTimeoutMs);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr = `${stderr}${chunk}`.slice(-8_000);
    });
    child.on("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      if (error.code === "ENOENT") {
        reject(
          new Error(
            "MinerU module executable was not found. Check the modules directory in Settings.",
          ),
        );
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `MinerU conversion failed${code === null ? "" : ` (exit ${code})`}${stderr.trim() ? `: ${stderr.trim()}` : "."}`,
          ),
        );
    });
  });
}

function localAssetPath(source: string) {
  const clean = decodeURIComponent(source.split(/[?#]/, 1)[0]);
  if (
    !clean ||
    path.isAbsolute(clean) ||
    clean.startsWith("data:") ||
    /^[a-z][a-z\d+.-]*:/i.test(clean)
  )
    return null;
  const normalized = path.normalize(clean);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) return null;
  return normalized;
}

async function publishImages(
  markdown: string,
  sourceDirectory: string,
  destinationDirectory: string,
  identifier: string,
) {
  const replacements = new Map<string, string>();
  for (const match of markdown.matchAll(markdownImage)) {
    const source = match[2];
    const relativePath = localAssetPath(source);
    if (!relativePath || replacements.has(source)) continue;
    const sourcePath = path.resolve(sourceDirectory, relativePath);
    const sourceRoot = `${path.resolve(sourceDirectory)}${path.sep}`;
    if (!sourcePath.startsWith(sourceRoot)) continue;
    try {
      const extension = path.extname(relativePath).toLowerCase() || ".bin";
      const token = `${replacements.size + 1}${extension}`;
      await fs.mkdir(destinationDirectory, { recursive: true });
      await fs.copyFile(
        sourcePath,
        path.join(/* turbopackIgnore: true */ destinationDirectory, token),
      );
      replacements.set(
        source,
        `/api/markdown-assets/${encodeURIComponent(identifier)}/${encodeURIComponent(token)}`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return markdown.replace(
    markdownImage,
    (whole, opening: string, source: string, closing: string) =>
      `${opening}${replacements.get(source) ?? source}${closing}`,
  );
}

async function pageCount(outputFiles: string[]) {
  const contentList = outputFiles.find((file) =>
    /content_list(?:_v2)?\.json$/i.test(file),
  );
  if (!contentList) return 0;
  try {
    const content = await fs.readFile(contentList, "utf8");
    const pages = [...content.matchAll(/"page_idx"\s*:\s*(\d+)/g)].map(
      (match) => Number(match[1]),
    );
    return pages.length ? Math.max(...pages) + 1 : 0;
  } catch {
    return 0;
  }
}

export async function convertPdfWithMineru(
  inputPath: string,
  temporaryOutputPath: string,
  markdownDirectory: string,
  identifier: string,
): Promise<MineruConversionResult> {
  await fs.mkdir(temporaryOutputPath, { recursive: true });
  await runMineru(inputPath, temporaryOutputPath);
  const outputFiles = await filesBelow(temporaryOutputPath);
  const markdownFiles = outputFiles.filter((file) =>
    file.toLowerCase().endsWith(".md"),
  );
  if (!markdownFiles.length)
    throw new Error("MinerU completed without producing a Markdown file.");
  const markdownPath = markdownFiles.sort(
    (left, right) => left.length - right.length,
  )[0];
  const rawContent = await fs.readFile(markdownPath, "utf8");
  const content = await publishImages(
    rawContent,
    path.dirname(markdownPath),
    path.join(markdownDirectory, identifier),
    identifier,
  );
  return { content, pages: await pageCount(outputFiles) };
}
