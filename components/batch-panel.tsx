"use client";

import * as React from "react";
import {
  Loader2,
  Upload,
  Sparkles,
  Play,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  predictBatch,
  ApiError,
  type TransactionIn,
  type Prediction,
} from "@/lib/api";
import {
  NUMERIC_FIELDS,
  validateTransaction,
  EXAMPLE_TRANSACTION,
} from "@/lib/transaction";
import { cn } from "@/lib/utils";

const MAX_BATCH = 10_000;
const NUMBER_KEYS = [...NUMERIC_FIELDS, "step"] as const;

const EXAMPLE_JSON = JSON.stringify(
  [
    EXAMPLE_TRANSACTION,
    {
      step: 1,
      type: "PAYMENT",
      amount: 9839.64,
      nameOrig: "C1231006815",
      oldbalanceOrg: 170136.0,
      newbalanceOrig: 160296.36,
      nameDest: "M1979787155",
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
    },
    {
      step: 1,
      type: "CASH_OUT",
      amount: 229133.94,
      nameOrig: "C905080434",
      oldbalanceOrg: 15325.0,
      newbalanceOrig: 0.0,
      nameDest: "C476402209",
      oldbalanceDest: 5083.0,
      newbalanceDest: 51513.44,
    },
  ],
  null,
  2
);

interface ParseResult {
  transactions?: TransactionIn[];
  error?: string;
}

// Parse either a JSON array / { transactions: [...] } or a headered CSV into
// validated TransactionIn[]. Returns a friendly error on the first problem.
function parseTransactions(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Nothing to parse — paste JSON/CSV or upload a file." };

  const raw =
    trimmed[0] === "[" || trimmed[0] === "{"
      ? parseJson(trimmed)
      : parseCsv(trimmed);
  if (raw.error) return { error: raw.error };

  const rows = raw.rows!;
  if (rows.length < 1) return { error: "No transactions found." };
  if (rows.length > MAX_BATCH) {
    return { error: `Too many transactions (${rows.length}). Limit is ${MAX_BATCH}.` };
  }

  const transactions: TransactionIn[] = [];
  for (let i = 0; i < rows.length; i++) {
    const { errors, data } = validateTransaction(rows[i]);
    if (!data) {
      const first = Object.entries(errors)[0];
      return {
        error: `Row ${i + 1}: ${first ? `${first[0]} — ${first[1]}` : "invalid"}`,
      };
    }
    transactions.push(data);
  }
  return { transactions };
}

function parseJson(text: string): { rows?: Record<string, unknown>[]; error?: string } {
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { transactions?: unknown }).transactions)
        ? (parsed as { transactions: unknown[] }).transactions
        : null;
    if (!arr) return { error: 'JSON must be an array or { "transactions": [...] }.' };
    return { rows: arr as Record<string, unknown>[] };
  } catch {
    return { error: "Invalid JSON." };
  }
}

function parseCsv(text: string): { rows?: Record<string, unknown>[]; error?: string } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    return { error: "CSV needs a header row and at least one data row." };
  }
  const header = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    const obj: Record<string, unknown> = {};
    header.forEach((key, idx) => {
      const value = (cells[idx] ?? "").trim();
      // Coerce numeric columns; leave type/name* as strings.
      obj[key] = (NUMBER_KEYS as readonly string[]).includes(key)
        ? value === ""
          ? NaN
          : Number(value)
        : value;
    });
    rows.push(obj);
  }
  return { rows };
}

type SortDir = "asc" | "desc";

export function BatchPanel() {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<
    { txn: TransactionIn; pred: Prediction }[]
  >([]);
  const [sortDir, setSortDir] = React.useState<SortDir | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    setError(null);
    // Allow re-uploading the same file.
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    setError(null);
    setRows([]);

    const { transactions, error: parseError } = parseTransactions(text);
    if (!transactions) {
      setError(parseError ?? "Could not parse input.");
      return;
    }

    setLoading(true);
    try {
      const res = await predictBatch(transactions);
      setRows(
        res.predictions.map((pred, i) => ({ txn: transactions[i], pred }))
      );
      setSortDir(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const sortedRows = React.useMemo(() => {
    if (!sortDir) return rows;
    return [...rows].sort((a, b) =>
      sortDir === "asc"
        ? a.pred.ensemble_score - b.pred.ensemble_score
        : b.pred.ensemble_score - a.pred.ensemble_score
    );
  }, [rows, sortDir]);

  const total = rows.length;
  const anomalies = rows.filter((r) => r.pred.is_anomaly).length;
  const rate = total > 0 ? (anomalies / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <label htmlFor="batch-input" className="mb-1.5 block text-sm font-medium">
              Paste JSON or CSV
            </label>
            <textarea
              id="batch-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              rows={8}
              spellCheck={false}
              placeholder={
                'JSON: [{ "step": 1, "type": "TRANSFER", ... }]\n\nCSV: step,type,amount,nameOrig,oldbalanceOrg,newbalanceOrig,nameDest,oldbalanceDest,newbalanceDest'
              }
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              1–{MAX_BATCH.toLocaleString()} transactions. CSV must include a
              header row with all 9 field names.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={loading} className="min-w-[150px]">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scoring...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Score batch
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload CSV / JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={onFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setText(EXAMPLE_JSON);
                setError(null);
              }}
            >
              <Sparkles className="h-4 w-4" />
              Load example
            </Button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red"
            >
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {total > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <SummaryStat label="Transactions" value={total.toLocaleString()} />
            <SummaryStat
              label="Anomalies"
              value={anomalies.toLocaleString()}
              tone={anomalies > 0 ? "danger" : "normal"}
            />
            <SummaryStat
              label="Anomaly rate"
              value={`${rate.toFixed(1)}%`}
              tone={rate > 0 ? "danger" : "normal"}
            />
          </div>

          {/* Results table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Origin → Dest</th>
                    <th className="px-4 py-3 font-medium">Segment</th>
                    <th className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() =>
                          setSortDir((d) =>
                            d === "desc" ? "asc" : "desc"
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        aria-label="Sort by ensemble score"
                      >
                        Score
                        <ArrowUpDown className="h-3 w-3" />
                        {sortDir && (
                          <span className="text-[10px]">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">Verdict</th>
                    <th className="px-4 py-3 text-right font-medium">
                      IF / LOF / AE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(({ txn, pred }, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-border/60 last:border-0",
                        pred.is_anomaly ? "bg-red/5" : "bg-emerald/5"
                      )}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{txn.type}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {txn.amount.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {txn.nameOrig} → {txn.nameDest}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone="primary">Seg {pred.cluster}</Badge>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-medium">
                        {(pred.ensemble_score * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5">
                        {pred.is_anomaly ? (
                          <Badge tone="danger">Anomaly</Badge>
                        ) : (
                          <Badge tone="success">Normal</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
                        {pred.if_score.toFixed(3)} / {pred.lof_score.toFixed(3)} /{" "}
                        {pred.ae_score.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "danger";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={cn(
            "flex items-center gap-2 text-2xl font-bold tabular-nums",
            tone === "danger" ? "text-red" : "text-foreground"
          )}
        >
          {tone === "danger" && <AlertTriangle className="h-5 w-5" />}
          {value}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
