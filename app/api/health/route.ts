import { fetchBackend, isAbort } from "@/lib/backend";

// Server-side proxy for the backend health check. Runs server-side so it can
// call the plain-HTTP EC2 backend without triggering browser mixed-content
// blocking. Backend contract: GET /health -> { "status": "ok" }.
const TIMEOUT_MS = 8_000;

export async function GET() {
  try {
    const upstream = await fetchBackend("/health", { method: "GET" }, TIMEOUT_MS);

    if (!upstream.ok) {
      return Response.json(
        { error: `Health check failed (${upstream.status}).` },
        { status: 502 }
      );
    }

    const result = (await upstream.json()) as { status?: string };
    return Response.json({ status: result.status ?? "unknown" });
  } catch (err) {
    return Response.json(
      {
        error: isAbort(err)
          ? "The anomaly detection service took too long to respond."
          : "Could not reach the anomaly detection API. It may be offline.",
      },
      { status: 502 }
    );
  }
}
