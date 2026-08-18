import type { TransactionIn, TransactionType } from "@/lib/api";

// Shared, environment-agnostic helpers for the 9-field PaySim transaction
// shape. Imported by the client form (pre-send validation) and by the
// server proxy routes (never trust the client alone).

export const TRANSACTION_TYPES: TransactionType[] = [
  "CASH_IN",
  "CASH_OUT",
  "DEBIT",
  "PAYMENT",
  "TRANSFER",
];

// Field names are byte-for-byte identical to the API contract.
// Gotcha: `oldbalanceOrg` ends in "Org", `newbalanceOrig` ends in "Orig".
export const NUMERIC_FIELDS = [
  "amount",
  "oldbalanceOrg",
  "newbalanceOrig",
  "oldbalanceDest",
  "newbalanceDest",
] as const;

export const STRING_FIELDS = ["nameOrig", "nameDest"] as const;

// Human-readable labels for the form.
export const FIELD_LABELS: Record<keyof TransactionIn, string> = {
  step: "Step (sim. hour)",
  type: "Transaction type",
  amount: "Amount",
  nameOrig: "Origin account (nameOrig)",
  oldbalanceOrg: "Origin balance — before (oldbalanceOrg)",
  newbalanceOrig: "Origin balance — after (newbalanceOrig)",
  nameDest: "Destination account (nameDest)",
  oldbalanceDest: "Destination balance — before (oldbalanceDest)",
  newbalanceDest: "Destination balance — after (newbalanceDest)",
};

// Prefill / "Try an example" values — straight from the API contract.
export const EXAMPLE_TRANSACTION: TransactionIn = {
  step: 1,
  type: "TRANSFER",
  amount: 181.0,
  nameOrig: "C1231006815",
  oldbalanceOrg: 181.0,
  newbalanceOrig: 0.0,
  nameDest: "C1666544295",
  oldbalanceDest: 0.0,
  newbalanceDest: 0.0,
};

export const EMPTY_TRANSACTION: TransactionIn = {
  step: 1,
  type: "PAYMENT",
  amount: 0,
  nameOrig: "",
  oldbalanceOrg: 0,
  newbalanceOrig: 0,
  nameDest: "",
  oldbalanceDest: 0,
  newbalanceDest: 0,
};

export interface ValidationResult {
  errors: Partial<Record<keyof TransactionIn, string>>;
  data: TransactionIn | null;
}

/**
 * Validate an unknown object against the TransactionIn contract.
 * Returns per-field errors and, when valid, a normalized TransactionIn.
 */
export function validateTransaction(
  body: Record<string, unknown>
): ValidationResult {
  const errors: Partial<Record<keyof TransactionIn, string>> = {};

  // type
  if (!TRANSACTION_TYPES.includes(body.type as TransactionType)) {
    errors.type = `Must be one of: ${TRANSACTION_TYPES.join(", ")}`;
  }

  // step — non-negative integer
  const step = body.step;
  if (typeof step !== "number" || Number.isNaN(step)) {
    errors.step = "Required and must be a number";
  } else if (!Number.isInteger(step)) {
    errors.step = "Must be a whole number";
  } else if (step < 0) {
    errors.step = "Must be 0 or greater";
  }

  // numeric fields — non-negative numbers
  for (const field of NUMERIC_FIELDS) {
    const value = body[field];
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors[field] = "Required and must be a number";
    } else if (value < 0) {
      errors[field] = "Must be 0 or greater";
    }
  }

  // string account ids
  for (const field of STRING_FIELDS) {
    const value = body[field];
    if (typeof value !== "string" || value.trim() === "") {
      errors[field] = "Required";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, data: null };
  }

  return {
    errors: {},
    data: {
      step: body.step as number,
      type: body.type as TransactionType,
      amount: body.amount as number,
      nameOrig: (body.nameOrig as string).trim(),
      oldbalanceOrg: body.oldbalanceOrg as number,
      newbalanceOrig: body.newbalanceOrig as number,
      nameDest: (body.nameDest as string).trim(),
      oldbalanceDest: body.oldbalanceDest as number,
      newbalanceDest: body.newbalanceDest as number,
    },
  };
}

/** Runtime guard for a backend Prediction response. */
export function isPrediction(value: unknown): value is import("@/lib/api").Prediction {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.cluster === "number" &&
    typeof p.ensemble_score === "number" &&
    typeof p.is_anomaly === "boolean" &&
    typeof p.if_score === "number" &&
    typeof p.lof_score === "number" &&
    typeof p.ae_score === "number"
  );
}
