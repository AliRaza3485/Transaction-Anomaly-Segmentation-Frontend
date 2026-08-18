import { cn } from "@/lib/utils";

// Mini breakdown of the three raw per-model anomaly scores.
// These live on different scales (e.g. IF ~0.6, LOF ~1.0, AE ~0.003) and are
// unbounded, so bar widths are RELATIVE to the largest of the three and are a
// visual aid only — the raw number is the source of truth. Higher = more
// anomalous.
const MODELS = [
  { key: "if_score", label: "Isolation Forest", abbr: "IF" },
  { key: "lof_score", label: "Local Outlier Factor", abbr: "LOF" },
  { key: "ae_score", label: "Autoencoder", abbr: "AE" },
] as const;

export function ModelScoreBars({
  if_score,
  lof_score,
  ae_score,
}: {
  if_score: number;
  lof_score: number;
  ae_score: number;
}) {
  const values = { if_score, lof_score, ae_score };
  const max = Math.max(Math.abs(if_score), Math.abs(lof_score), Math.abs(ae_score), 1e-9);

  return (
    <div className="space-y-3">
      {MODELS.map((m) => {
        const value = values[m.key];
        const width = Math.max(0, Math.min(1, value / max)) * 100;
        return (
          <div key={m.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {m.label}{" "}
                <span className="font-mono text-[10px] opacity-70">{m.abbr}</span>
              </span>
              <span className="font-mono font-medium tabular-nums">
                {value.toFixed(4)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-primary transition-all duration-500")}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[11px] leading-snug text-muted-foreground">
        Raw model scores (higher = more anomalous). Bars are relative to the
        largest of the three, for comparison only.
      </p>
    </div>
  );
}
