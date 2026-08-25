import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import { SqliteAppRepository } from "@/shared/infrastructure/sqlite-repository";
import { getStorageConfig } from "@/shared/infrastructure/storage-config";
import type { AppState } from "@/shared/model/app-state";
import { isAppState } from "@/shared/model/app-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = new SqliteAppRepository();

const storageFolders = [
  "files",
  "attachments",
  "library",
  "notes",
  "project",
  "reference",
] as const;
const archiveFolders = [...storageFolders, "background-audio"] as const;
const backupManifestVersion = 2;
const maxBackupSize = 1024 * 1024 * 1024;

function isSafeArchiveEntry(entryName: string) {
  const raw = entryName.replaceAll("\\", "/");
  const normalized = raw.replace(/\/+$/, "");
  const parts = normalized.split("/");
  return (
    normalized.length > 0 &&
    !normalized.startsWith("/") &&
    !normalized.includes("\0") &&
    parts.every((part) => part.length > 0 && part !== "." && part !== "..") &&
    parts.length >= (raw.endsWith("/") ? 1 : 2) &&
    archiveFolders.includes(parts[0] as (typeof archiveFolders)[number])
  );
}

function remapAttachmentPath(filePath: string, dataDirectory: string) {
  const normalized = filePath.replaceAll("\\", "/");
  for (const folder of archiveFolders) {
    if (normalized === folder || normalized.startsWith(`${folder}/`)) {
      const suffix = normalized.slice(folder.length + 1);
      return suffix
        ? path.join(dataDirectory, folder, ...suffix.split("/"))
        : path.join(dataDirectory, folder);
    }
  }
  const relative = path.relative(dataDirectory, filePath);
  if (
    relative &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  )
    return path.join(dataDirectory, relative);

  for (const folder of archiveFolders) {
    const marker = `/${folder}/`;
    const markerIndex = normalized.indexOf(marker);
    if (markerIndex >= 0) {
      const suffix = normalized.slice(markerIndex + marker.length);
      return path.join(dataDirectory, folder, ...suffix.split("/"));
    }
  }
  return path.join(dataDirectory, "attachments", path.basename(filePath));
}

function remapRestoredState(state: AppState, dataDirectory: string): AppState {
  return {
    ...state,
    attachments: state.attachments.map((attachment) => ({
      ...attachment,
      filePath: attachment.filePath
        ? remapAttachmentPath(attachment.filePath, dataDirectory)
        : "",
    })),
  };
}

function storageDestination(
  dataDirectory: string,
  backgroundMusicDirectory: string,
  folder: (typeof archiveFolders)[number],
) {
  return folder === "background-audio"
    ? backgroundMusicDirectory
    : path.join(dataDirectory, folder);
}

export async function GET() {
  try {
    const config = getStorageConfig();
    const dataDirectory = config.storageDirectory;
    const state = await repository.load();
    const zip = new AdmZip();
    zip.addFile("circo.json", Buffer.from(JSON.stringify(state, null, 2)));
    zip.addFile(
      "manifest.json",
      Buffer.from(
        JSON.stringify(
          {
            version: backupManifestVersion,
            state: "circo.json",
            folders: archiveFolders,
            createdAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ),
    );
    for (const folder of archiveFolders) {
      const localPath = storageDestination(
        dataDirectory,
        config.backgroundMusicDirectory,
        folder,
      );
      if (fs.existsSync(/* turbopackIgnore: true */ localPath))
        zip.addLocalFolder(localPath, folder);
    }
    return new Response(new Uint8Array(zip.toBuffer()), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Circo-backup-${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const config = getStorageConfig();
  const dataDirectory = config.storageDirectory;
  const temporary = path.join(dataDirectory, `restore-${randomUUID()}`);
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Missing backup." }, { status: 422 });
    if (file.size > maxBackupSize)
      return Response.json(
        { error: "Backup exceeds 1 GB." },
        { status: 413 },
      );
    const zip = new AdmZip(Buffer.from(await file.arrayBuffer()));
    const stateEntry = zip.getEntry("circo.json");
    if (!stateEntry)
      return Response.json(
        { error: "Backup manifest is missing." },
        { status: 422 },
      );
    const parsed: unknown = JSON.parse(stateEntry.getData().toString("utf8"));
    if (!isAppState(parsed))
      return Response.json(
        { error: "Backup is incompatible." },
        { status: 422 },
      );
    const manifestEntry = zip.getEntry("manifest.json");
    let foldersToReplace = new Set<string>();
    if (manifestEntry) {
      const manifest: unknown = JSON.parse(
        manifestEntry.getData().toString("utf8"),
      );
      const manifestFolders =
        manifest && typeof manifest === "object"
          ? (manifest as { folders?: unknown }).folders
          : undefined;
      if (
        !manifest ||
        typeof manifest !== "object" ||
        (manifest as { version?: unknown }).version !== backupManifestVersion ||
        !Array.isArray(manifestFolders) ||
        !manifestFolders.every(
          (folder) =>
            typeof folder === "string" &&
            archiveFolders.includes(folder as (typeof archiveFolders)[number]),
        )
      ) {
        return Response.json(
          { error: "Backup manifest is invalid." },
          { status: 422 },
        );
      }
      foldersToReplace = new Set(manifestFolders as string[]);
    }
    fs.mkdirSync(temporary, { recursive: true });
    for (const entry of zip.getEntries()) {
      if (entry.entryName === "circo.json" || entry.entryName === "manifest.json")
        continue;
      if (!isSafeArchiveEntry(entry.entryName)) {
        return Response.json(
          { error: "Backup contains an unsafe path." },
          { status: 422 },
        );
      }
      foldersToReplace.add(entry.entryName.split("/")[0]);
      if (entry.isDirectory) continue;
      const destination = path.join(temporary, entry.entryName);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, entry.getData());
    }
    await repository.restore(remapRestoredState(parsed, dataDirectory));
    for (const folder of foldersToReplace) {
      const source = path.join(temporary, folder);
      const destination = storageDestination(
        dataDirectory,
        config.backgroundMusicDirectory,
        folder as (typeof archiveFolders)[number],
      );
      fs.rmSync(destination, { recursive: true, force: true });
      fs.mkdirSync(destination, { recursive: true });
      if (fs.existsSync(source))
        fs.cpSync(source, destination, { recursive: true, force: true });
    }
    return Response.json(await repository.load());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore failed.";
    return Response.json({ error: message }, { status: 400 });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
