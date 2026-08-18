import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "danger" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald/15 text-emerald",
  danger: "bg-red/15 text-red",
  primary: "bg-primary/15 text-primary",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
