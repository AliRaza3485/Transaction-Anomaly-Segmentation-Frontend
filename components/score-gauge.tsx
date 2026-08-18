// Anomaly-score gauge. `score` is 0..1 (the ensemble_score = mean percentile
// rank across the 3 models). Colour bands escalate toward the ~0.96 flag
// threshold: >=0.9 danger (red), >=0.7 elevated (amber), else normal (green).
const FLAG_THRESHOLD = 0.96;

function colorFor(score: number): string {
  if (score >= 0.9) return "var(--red)";
  if (score >= 0.7) return "#f59e0b"; // amber — no theme token, intentional
  return "var(--emerald)";
}

export function ScoreGauge({
  score,
  label = "Anomaly score",
}: {
  score: number;
  label?: string;
}) {
  const clamped = Math.min(Math.max(score, 0), 1);
  const pct = Math.round(clamped * 1000) / 10;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: colorFor(clamped) }}
        />
      </div>
      <div className="relative mt-1 h-4">
        {/* Flag-threshold tick (~96%) */}
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${FLAG_THRESHOLD * 100}%` }}
        >
          <span className="text-[10px] leading-none text-muted-foreground">
            flag ≈96%
          </span>
        </div>
      </div>
    </div>
  );
}
