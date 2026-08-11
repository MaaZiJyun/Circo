import { SqliteAppRepository } from "@/shared/infrastructure/sqlite-repository";
import { isAppState } from "@/shared/model/app-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = new SqliteAppRepository();

function failure(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown persistence error.";
  return Response.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    return Response.json(await repository.load());
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isAppState(body))
      return Response.json({ error: "Invalid state." }, { status: 422 });
    return Response.json(await repository.save(body));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isAppState(body))
      return Response.json({ error: "Invalid backup." }, { status: 422 });
    return Response.json(await repository.restore(body));
  } catch (error) {
    return failure(error);
  }
}
