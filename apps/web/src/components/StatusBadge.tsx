import type { ServiceStatus } from "@openclaw/shared";
import { cn } from "../lib/cn";

const toneMap: Record<ServiceStatus | "connected" | "not_configured" | "error", string> = {
  running: "bg-emerald-50 text-emerald-600",
  degraded: "bg-amber-50 text-amber-600",
  starting: "bg-blue-50 text-blue-600",
  stopped: "bg-slate-100 text-slate-500",
  error: "bg-red-50 text-red-600",
  unknown: "bg-slate-100 text-slate-500",
  connected: "bg-emerald-50 text-emerald-600",
  not_configured: "bg-slate-100 text-slate-500"
};

export function StatusBadge({
  status,
  label
}: {
  status: keyof typeof toneMap;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        toneMap[status]
      )}
    >
      {label ?? status}
    </span>
  );
}

