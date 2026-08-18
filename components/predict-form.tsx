"use client";

import * as React from "react";
import { Loader2, Sparkles, RotateCcw, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Label } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ResultCard } from "@/components/result-card";
import {
  predictTransaction,
  ApiError,
  type TransactionIn,
  type Prediction,
  type TransactionType,
} from "@/lib/api";
import {
  TRANSACTION_TYPES,
  EXAMPLE_TRANSACTION,
  EMPTY_TRANSACTION,
  validateTransaction,
} from "@/lib/transaction";

type FieldErrors = Partial<Record<keyof TransactionIn, string>>;

export function PredictForm() {
  // Prefill with the contract example so the form is ready to submit.
  const [form, setForm] = React.useState<TransactionIn>(EXAMPLE_TRANSACTION);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Prediction | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);

  function updateNumeric(field: keyof TransactionIn, value: string) {
    const num = value === "" ? NaN : Number(value);
    setForm((prev) => ({ ...prev, [field]: num }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function updateText(field: keyof TransactionIn, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setResult(null);

    // Validate with the same rules the server uses.
    const { errors: validationErrors, data } = validateTransaction(
      form as unknown as Record<string, unknown>
    );
    if (!data) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      setResult(await predictTransaction(data));
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function loadExample() {
    setForm(EXAMPLE_TRANSACTION);
    setErrors({});
    setResult(null);
    setApiError(null);
  }

  function clearForm() {
    setForm(EMPTY_TRANSACTION);
    setErrors({});
    setResult(null);
    setApiError(null);
  }

  // Render helpers — plain functions (NOT nested components), so inputs keep
  // focus across keystrokes instead of remounting each render.
  function numberField(
    field: keyof TransactionIn,
    label: string,
    integer = false
  ) {
    const raw = form[field] as number;
    return (
      <div>
        <Label htmlFor={field}>{label}</Label>
        <Input
          id={field}
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={integer ? 1 : "any"}
          min={0}
          value={Number.isNaN(raw) ? "" : raw}
          onChange={(e) => updateNumeric(field, e.target.value)}
          aria-invalid={!!errors[field]}
        />
        {errors[field] && (
          <p className="mt-1 text-xs text-red">{errors[field]}</p>
        )}
      </div>
    );
  }

  function textField(
    field: keyof TransactionIn,
    label: string,
    placeholder?: string
  ) {
    return (
      <div>
        <Label htmlFor={field}>{label}</Label>
        <Input
          id={field}
          type="text"
          placeholder={placeholder}
          value={form[field] as string}
          onChange={(e) => updateText(field, e.target.value)}
          aria-invalid={!!errors[field]}
        />
        {errors[field] && (
          <p className="mt-1 text-xs text-red">{errors[field]}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground">
                Transaction
              </legend>
              <div>
                <Label htmlFor="type">Transaction type</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as TransactionType,
                    }))
                  }
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {numberField("step", "Step (sim. hour)", true)}
                {numberField("amount", "Amount")}
              </div>
            </fieldset>

            {/* Origin */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground">
                Origin account
              </legend>
              {textField("nameOrig", "Origin ID (nameOrig)", "C1231006815")}
              <div className="grid grid-cols-2 gap-4">
                {numberField("oldbalanceOrg", "Balance before (oldbalanceOrg)")}
                {numberField("newbalanceOrig", "Balance after (newbalanceOrig)")}
              </div>
            </fieldset>

            {/* Destination */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground">
                Destination account
              </legend>
              {textField("nameDest", "Destination ID (nameDest)", "C1666544295")}
              <div className="grid grid-cols-2 gap-4">
                {numberField("oldbalanceDest", "Balance before (oldbalanceDest)")}
                {numberField("newbalanceDest", "Balance after (newbalanceDest)")}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={loading} className="flex-1 min-w-[160px]">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4" />
                    Score transaction
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={loadExample}>
                <Sparkles className="h-4 w-4" />
                Load example
              </Button>
              <Button type="button" variant="ghost" onClick={clearForm}>
                <RotateCcw className="h-4 w-4" />
                Clear
              </Button>
            </div>

            {apiError && (
              <div
                role="alert"
                className="rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red"
              >
                {apiError}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <div>
        {result ? (
          <ResultCard result={result} />
        ) : (
          <Card className="flex h-full min-h-[300px] items-center justify-center border-dashed">
            <CardContent className="text-center text-sm text-muted-foreground">
              Fill in the transaction details and submit to see the anomaly
              verdict, score, and segment here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
