import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import { SqliteAppRepository } from "@/shared/infrastructure/sqlite-repository";
import { getStorageConfig } from "@/shared/infrastructure/storage-config";
import { isAppState } from "@/shared/model/app-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = new SqliteAppRepository();
export async function GET() {
  try {
    const dataDirectory = getStorageConfig().storageDirectory;
    const state = await repository.load();
    const zip = new AdmZip();
    zip.addFile("circo.json", Buffer.from(JSON.stringify(state, null, 2)));
    for (const folder of ["files", "attachments"]) {
      const localPath = path.join(
        /* turbopackIgnore: true */ dataDirectory,
        folder,
      );
      if (fs.existsSync(/* turbopackIgnore: true */ localPath))
        zip.addLocalFolder(localPath, folder);
    }
    return new Response(new Uint8Array(zip.toBuffer()), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="circo-backup-${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const dataDirectory = getStorageConfig().storageDirectory;
  const temporary = path.join(dataDirectory, `restore-${randomUUID()}`);
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Missing backup." }, { status: 422 });
    if (file.size > 200 * 1024 * 1024)
      return Response.json(
        { error: "Backup exceeds 200 MB." },
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
    fs.mkdirSync(temporary, { recursive: true });
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || entry.entryName === "circo.json") continue;
      if (
        !/^(files|attachments)\/[a-z0-9-]+\.[a-z0-9]{1,10}$/i.test(
          entry.entryName,
        )
      ) {
        return Response.json(
          { error: "Backup contains an unsafe path." },
          { status: 422 },
        );
      }
      const destination = path.join(temporary, entry.entryName);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, entry.getData());
    }
    await repository.restore(parsed);
    for (const folder of ["files", "attachments"]) {
      const source = path.join(temporary, folder);
      const destination = path.join(
        /* turbopackIgnore: true */ dataDirectory,
        folder,
      );
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
