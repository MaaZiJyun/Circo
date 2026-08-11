import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { StorageConfig } from "@/shared/model/storage-config";
import { isStorageConfig } from "@/shared/model/storage-config";

const defaultDirectory = path.join(process.cwd(), "data");
const configPath = path.join(defaultDirectory, "storage-config.json");

export const defaultStorageConfig: StorageConfig = {
  databasePath: path.join(defaultDirectory, "circo.db"),
  storageDirectory: defaultDirectory,
};

export function getStorageConfig(): StorageConfig {
  if (!fs.existsSync(configPath)) return defaultStorageConfig;
  try {
    const value: unknown = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return isStorageConfig(value) ? value : defaultStorageConfig;
  } catch {
    return defaultStorageConfig;
  }
}

function prepareConfig(config: StorageConfig): StorageConfig {
  const databasePath = config.databasePath.trim();
  const storageDirectory = config.storageDirectory.trim();
  if (!path.isAbsolute(databasePath) || !path.isAbsolute(storageDirectory))
    throw new Error("Database and storage paths must be absolute.");
  if (databasePath.length > 1000 || storageDirectory.length > 1000)
    throw new Error("Storage path is too long.");
  if (fs.existsSync(databasePath) && fs.statSync(databasePath).isDirectory())
    throw new Error("Database path must point to a file.");
  if (
    fs.existsSync(storageDirectory) &&
    !fs.statSync(storageDirectory).isDirectory()
  )
    throw new Error("Storage path must point to a directory.");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  fs.mkdirSync(storageDirectory, { recursive: true });
  fs.accessSync(path.dirname(databasePath), fs.constants.W_OK);
  fs.accessSync(storageDirectory, fs.constants.W_OK);
  const database = new Database(databasePath);
  database.pragma("schema_version");
  database.close();
  return { databasePath, storageDirectory };
}

export function saveStorageConfig(config: StorageConfig): StorageConfig {
  const saved = prepareConfig(config);
  fs.mkdirSync(defaultDirectory, { recursive: true });
  const temporaryPath = `${configPath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(saved, null, 2));
  fs.renameSync(temporaryPath, configPath);
  return saved;
}

export function getStoragePath(...parts: string[]) {
  return path.join(
    /* turbopackIgnore: true */ getStorageConfig().storageDirectory,
    ...parts,
  );
}
