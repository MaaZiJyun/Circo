export interface StorageConfig {
  databasePath: string;
  storageDirectory: string;
}

export function isStorageConfig(value: unknown): value is StorageConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<StorageConfig>;
  return (
    typeof config.databasePath === "string" &&
    typeof config.storageDirectory === "string"
  );
}
