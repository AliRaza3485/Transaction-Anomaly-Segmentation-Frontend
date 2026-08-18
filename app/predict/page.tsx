import { PredictForm } from "@/components/predict-form";

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Score a transaction
        </h1>
        <p className="mt-2 text-muted-foreground">
          Fill in the transaction details below to get an instant anomaly
          verdict, an overall anomaly score, the segment it belongs to, and a
          per-model breakdown.
        </p>
      </div>

      <PredictForm />
    </div>
  );
}
