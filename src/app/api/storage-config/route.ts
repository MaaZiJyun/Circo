import {
  getStorageConfig,
  saveStorageConfig,
} from "@/shared/infrastructure/storage-config";
import { isStorageConfig } from "@/shared/model/storage-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getStorageConfig());
}

export async function PUT(request: Request) {
  try {
    const value: unknown = await request.json();
    if (!isStorageConfig(value))
      return Response.json({ error: "Invalid storage config." }, { status: 422 });
    return Response.json(saveStorageConfig(value));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save paths.";
    return Response.json({ error: message }, { status: 400 });
  }
}
