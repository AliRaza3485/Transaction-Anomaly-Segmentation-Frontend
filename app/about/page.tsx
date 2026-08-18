import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// This is a Server Component, so it's safe to read the server env var
// directly. This produces a plain <a> link (browser navigation) to the
// backend's Swagger docs, not a fetch call — so it isn't subject to
// HTTPS -> HTTP mixed-content blocking the way the predict/health calls are.
const BACKEND_URL = process.env.API_URL ?? "http://34.236.46.109:8000";

const facts = [
  { label: "Detectors", value: "3" },
  { label: "Ensemble score", value: "0–1" },
  { label: "Flag threshold", value: "≈0.96" },
  { label: "Dataset", value: "PaySim" },
];

const detectors = [
  {
    name: "Isolation Forest (if_score)",
    desc: "Isolates points via random splits — anomalies need fewer splits to isolate.",
  },
  {
    name: "Local Outlier Factor (lof_score)",
    desc: "Compares a point's local density to its neighbours' to flag local outliers.",
  },
  {
    name: "Autoencoder (ae_score)",
    desc: "Reconstruction error from a neural net trained on normal transactions.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        About this project
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        FraudGuard is an end-to-end machine learning system for{" "}
        <strong>anomaly detection and segmentation</strong> of financial
        transactions. Three unsupervised detectors are combined into a single
        anomaly score (the mean percentile rank across the models), and each
        transaction is assigned to a behavioural segment via clustering. The
        model was trained on the PaySim dataset, containerized with Docker,
        wired into a CI/CD pipeline, and deployed on AWS EC2 &mdash; this
        frontend calls that live FastAPI service.
      </p>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold">At a glance</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-lg bg-muted p-4 text-center">
                <div className="text-xl font-bold text-primary">{f.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{f.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold">The ensemble</h2>
          <div className="space-y-4">
            {detectors.map((d) => (
              <div key={d.name}>
                <div className="font-medium">{d.name}</div>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <a
        href={`${BACKEND_URL}/docs`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        View API documentation
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
