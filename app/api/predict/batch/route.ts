import { fetchBackend, isAbort } from "@/lib/backend";
import { validateTransaction, isPrediction } from "@/lib/transaction";
import type { TransactionIn } from "@/lib/api";

// Server-side proxy for POST /predict/batch (score 1..10000 transactions).
// Request:  { transactions: TransactionIn[] }
// Response: { predictions: Prediction[], count: number }
const TIMEOUT_MS = 60_000;
const MAX_BATCH = 10_000;

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

  const transactions = (body as { transactions?: unknown })?.transactions;
  if (!Array.isArray(transactions)) {
    return Response.json(
      { error: 'Request body must be { "transactions": [...] }.' },
      { status: 422 }
    );
  }
  if (transactions.length < 1) {
    return Response.json(
      { error: "Provide at least 1 transaction." },
      { status: 422 }
    );
  }
  if (transactions.length > MAX_BATCH) {
    return Response.json(
      { error: `Too many transactions (${transactions.length}). Limit is ${MAX_BATCH}.` },
      { status: 422 }
    );
  }

  // Re-validate every row server-side; never trust the client alone.
  const validated: TransactionIn[] = [];
  for (let i = 0; i < transactions.length; i++) {
    const { errors, data } = validateTransaction(
      (transactions[i] ?? {}) as Record<string, unknown>
    );
    if (!data) {
      const first = Object.entries(errors)[0];
      return Response.json(
        {
          error: `Row ${i + 1}: ${
            first ? `${first[0]} — ${first[1]}` : "invalid transaction"
          }`,
        },
        { status: 422 }
      );
    }
    validated.push(data);
  }

  try {
    const upstream = await fetchBackend(
      "/predict/batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: validated }),
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

    const result = (await upstream.json()) as {
      predictions?: unknown;
      count?: unknown;
    };
    if (
      !Array.isArray(result.predictions) ||
      !result.predictions.every(isPrediction) ||
      typeof result.count !== "number"
    ) {
      return Response.json(
        { error: "Unexpected response from the anomaly detection service." },
        { status: 502 }
      );
    }

    return Response.json({
      predictions: result.predictions,
      count: result.count,
    });
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
