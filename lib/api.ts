// The browser calls these same-origin Next.js API routes (app/api/predict,
// app/api/predict/batch, app/api/health), never the EC2 backend directly.
// Those routes run server-side and proxy to the FastAPI backend, which avoids
// HTTPS -> HTTP mixed-content blocking (the site may be served over HTTPS,
// but the EC2 backend is plain HTTP) and keeps the backend URL out of the
// client bundle.

export type TransactionType =
  | "CASH_IN"
  | "CASH_OUT"
  | "DEBIT"
  | "PAYMENT"
  | "TRANSFER";

export interface TransactionIn {
  step: number;
  type: TransactionType;
  amount: number;
  nameOrig: string;
  oldbalanceOrg: number; // NOTE: origin balance BEFORE — suffix "Org"
  newbalanceOrig: number; // NOTE: origin balance AFTER — suffix "Orig"
  nameDest: string;
  oldbalanceDest: number;
  newbalanceDest: number;
}

export interface Prediction {
  cluster: number;
  ensemble_score: number;
  is_anomaly: boolean;
  if_score: number;
  lof_score: number;
  ae_score: number;
}

export interface BatchResponse {
  predictions: Prediction[];
  count: number;
}

export interface HealthResponse {
  status: string;
}

// The proxy routes normalize backend errors into a simple `{ error: string }`
// shape, so the client no longer needs to understand raw FastAPI
// validation-error arrays.
export interface ApiErrorShape {
  error?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseErrorBody(res: Response): Promise<ApiErrorShape | null> {
  try {
    return (await res.json()) as ApiErrorShape;
  } catch {
    return null;
  }
}

function messageForStatus(status: number, body: ApiErrorShape | null): string {
  if (status === 422) {
    return (
      body?.error ?? "Invalid input. Please review the transaction details."
    );
  }
  if (status >= 500) {
    return (
      body?.error ??
      "The anomaly detection service is currently unavailable. Please try again shortly."
    );
  }
  return body?.error ?? `Request failed (${status})`;
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch("/api/health", { method: "GET", cache: "no-store" });

  if (!res.ok) {
    throw new ApiError(`Health check failed (${res.status})`, res.status);
  }

  return res.json();
}

export async function predictTransaction(
  payload: TransactionIn
): Promise<Prediction> {
  let res: Response;

  try {
    res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(
      "Could not reach the anomaly detection API. It may be offline.",
      0
    );
  }

  if (!res.ok) {
    throw new ApiError(
      messageForStatus(res.status, await parseErrorBody(res)),
      res.status
    );
  }

  return res.json();
}

export async function predictBatch(
  transactions: TransactionIn[]
): Promise<BatchResponse> {
  let res: Response;

  try {
    res = await fetch("/api/predict/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions }),
    });
  } catch {
    throw new ApiError(
      "Could not reach the anomaly detection API. It may be offline.",
      0
    );
  }

  if (!res.ok) {
    throw new ApiError(
      messageForStatus(res.status, await parseErrorBody(res)),
      res.status
    );
  }

  return res.json();
}
