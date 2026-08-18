import Link from "next/link";
import { ArrowRight, ScanSearch, Layers, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiStatusBadge } from "@/components/api-status-badge";

const steps = [
  {
    icon: ScanSearch,
    title: "Enter a transaction",
    desc: "Provide the transaction type, amount, and origin/destination accounts and balances.",
  },
  {
    icon: Boxes,
    title: "An ensemble scores it",
    desc: "Isolation Forest, Local Outlier Factor, and an Autoencoder combine into one anomaly score, served via FastAPI.",
  },
  {
    icon: Layers,
    title: "Get a verdict + segment",
    desc: "See whether it's an anomaly, the overall score, and which behavioural segment it belongs to.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <ApiStatusBadge />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Anomaly detection &amp; segmentation for financial transactions
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          FraudGuard scores transactions in real time with an unsupervised
          three-model ensemble and assigns each one to a behavioural segment —
          deployed end-to-end with a full MLOps pipeline.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/predict">
            <Button size="lg">
              Score a transaction
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/batch">
            <Button size="lg" variant="outline">
              Batch scoring
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-20 grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <Card key={step.title}>
            <CardContent className="pt-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="mb-1 text-sm font-medium text-muted-foreground">
                Step {i + 1}
              </div>
              <h3 className="mb-1 font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
