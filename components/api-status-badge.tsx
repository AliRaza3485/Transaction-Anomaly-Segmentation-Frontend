"use client";

import * as React from "react";
import { checkHealth } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Status = "checking" | "online" | "offline";

export function ApiStatusBadge() {
  const [status, setStatus] = React.useState<Status>("checking");

  React.useEffect(() => {
    let cancelled = false;

    checkHealth()
      .then((res) => {
        if (!cancelled) setStatus(res.status === "ok" ? "online" : "offline");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <Badge tone="neutral">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking API
      </Badge>
    );
  }

  if (status === "online") {
    return (
      <Badge tone="success">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
        API Online
      </Badge>
    );
  }

  return (
    <Badge tone="danger">
      <span className="h-1.5 w-1.5 rounded-full bg-red" />
      API Offline
    </Badge>
  );
}
