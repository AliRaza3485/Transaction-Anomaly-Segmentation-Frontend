// Server-only helper for talking to the FastAPI backend.
// Only ever imported from app/api/*/route.ts (which run on the server), so the
// backend URL never reaches the client bundle.
//
// The backend URL is read from the server-only `API_URL` env var (NOT
// `NEXT_PUBLIC_`, so it stays server-side). Set it in .env.local — see
// .env.example.
const DEFAULT_BACKEND_URL = "http://34.236.46.109:8000";

export function backendUrl(): string {
  return process.env.API_URL ?? DEFAULT_BACKEND_URL;
}

/**
 * Fetch from the backend with an abort-based timeout so a slow/unreachable
 * host can't hang the Next.js request forever.
 */
export async function fetchBackend(
  path: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${backendUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}
