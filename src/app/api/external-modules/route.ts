import { getExternalModuleStatus } from "@/shared/infrastructure/external-modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getExternalModuleStatus());
}
