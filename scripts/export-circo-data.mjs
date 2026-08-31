import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import AdmZip from "adm-zip";
import Database from "better-sqlite3";

const archiveFolders = [
  "files",
  "attachments",
  "library",
  "notes",
  "project",
  "reference",
  "background-audio",
];
const sourceDirectory = path.resolve(process.argv[2] ?? "data");
const stamp = new Date().toISOString().slice(0, 10);
const outputPath = path.resolve(
  process.argv[3] ?? `dist/Circo-backup-${stamp}.zip`,
);
const databasePath = path.join(sourceDirectory, "circo.db");

if (!fs.existsSync(databasePath)) {
  throw new Error(`Circo database not found: ${databasePath}`);
}

const database = new Database(databasePath, { readonly: true });
const row = database
  .prepare("SELECT payload FROM app_snapshots WHERE id = 1")
  .get();
database.close();
if (!row || typeof row.payload !== "string") {
  throw new Error("The Circo database does not contain an app snapshot.");
}

const state = JSON.parse(row.payload);
const zip = new AdmZip();
zip.addFile("circo.json", Buffer.from(JSON.stringify(state, null, 2)));
zip.addFile(
  "manifest.json",
  Buffer.from(
    JSON.stringify(
      {
        version: 2,
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
  const localPath = path.join(sourceDirectory, folder);
  if (fs.existsSync(localPath)) zip.addLocalFolder(localPath, folder);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
zip.writeZip(outputPath);
console.log(`Circo backup created: ${outputPath}`);
