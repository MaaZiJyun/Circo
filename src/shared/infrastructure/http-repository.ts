import type { AppRepository, AppState } from "@/shared/model/app-state";
import { isAppState } from "@/shared/model/app-state";

async function parseResponse(response: Response): Promise<AppState> {
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "Request failed.";
    throw new Error(message);
  }
  if (!isAppState(payload))
    throw new Error("The server returned invalid data.");
  return payload;
}

export class HttpAppRepository implements AppRepository {
  async load(): Promise<AppState> {
    return parseResponse(await fetch("/api/state", { cache: "no-store" }));
  }

  async save(state: AppState): Promise<AppState> {
    return parseResponse(
      await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }),
    );
  }

  async restore(state: AppState): Promise<AppState> {
    return parseResponse(
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }),
    );
  }
}
