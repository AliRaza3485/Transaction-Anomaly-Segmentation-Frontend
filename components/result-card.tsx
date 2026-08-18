import { AlertTriangle, CheckCircle2, ChevronDown, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/score-gauge";
import { ModelScoreBars } from "@/components/model-score-bars";
import type { Prediction } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ResultCard({ result }: { result: Prediction }) {
  const anomaly = result.is_anomaly;

  return (
    <Card
      className={cn(
        "border-2",
        anomaly ? "border-red/40 bg-red/5" : "border-emerald/40 bg-emerald/5"
      )}
    >
      <CardContent className="pt-6">
        {/* Headline verdict */}
        <div className="mb-5 flex items-start gap-3">
          {anomaly ? (
            <AlertTriangle className="h-8 w-8 shrink-0 text-red" />
          ) : (
            <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald" />
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  "text-xl font-semibold",
                  anomaly ? "text-red" : "text-emerald"
                )}
              >
                {anomaly ? "Anomaly" : "Normal"}
              </h3>
              <Badge tone="primary">
                <Layers className="h-3 w-3" />
                Segment {result.cluster}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {anomaly
                ? "This transaction stands out from normal behaviour."
                : "This transaction looks consistent with normal behaviour."}
            </p>
          </div>
        </div>

        {/* Overall ensemble score */}
        <ScoreGauge score={result.ensemble_score} label="Overall anomaly score" />

        {/* Collapsible per-model breakdown */}
        <details className="group mt-5 rounded-lg border border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
            <span>Per-model detail</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border px-4 py-4">
            <ModelScoreBars
              if_score={result.if_score}
              lof_score={result.lof_score}
              ae_score={result.ae_score}
            />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
