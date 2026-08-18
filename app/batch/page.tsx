import { BatchPanel } from "@/components/batch-panel";

export default function BatchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Batch scoring
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload a CSV or paste JSON for up to 10,000 transactions at once. Each
          row is scored for anomaly, assigned a segment, and shown in a sortable
          table with a summary.
        </p>
      </div>

      <BatchPanel />
    </div>
  );
}
