import { fetchBackend, isAbort } from "@/lib/backend";
import { validateTransaction, isPrediction } from "@/lib/transaction";

// Server-side proxy for POST /predict (score ONE transaction).
// Runs server-side so it can call the plain-HTTP EC2 backend without browser
// mixed-content blocking, and keeps `API_URL` out of the client bundle.
const TIMEOUT_MS = 15_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  // Re-validate server-side; never trust the client alone.
  const { errors, data } = validateTransaction(
    (body ?? {}) as Record<string, unknown>
  );
  if (!data) {
    const first = Object.entries(errors)[0];
    return Response.json(
      { error: first ? `${first[0]}: ${first[1]}` : "Invalid input." },
      { status: 422 }
    );
  }

  try {
    const upstream = await fetchBackend(
      "/predict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
      TIMEOUT_MS
    );

    if (!upstream.ok) {
      if (upstream.status === 422) {
        return Response.json(
          {
            error:
              "The anomaly detection service rejected these values. Please review your inputs.",
          },
          { status: 422 }
        );
      }
      return Response.json(
        {
          error: `Anomaly detection service returned an error (${upstream.status}).`,
        },
        { status: 502 }
      );
    }

    const result = await upstream.json();
    if (!isPrediction(result)) {
      return Response.json(
        { error: "Unexpected response from the anomaly detection service." },
        { status: 502 }
      );
    }

    return Response.json(result);
  } catch (err) {
    return Response.json(
      {
        error: isAbort(err)
          ? "The anomaly detection service took too long to respond. Please try again."
          : "Could not reach the anomaly detection API. It may be offline.",
      },
      { status: 502 }
    );
  }
}
