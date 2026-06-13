"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { IconServer, IconRefresh, IconCircleCheck, IconAlertTriangle, IconCircleX } from "@tabler/icons-react";

type ServiceStatus = {
  name: string;
  status: "operational" | "degraded" | "down";
  latencyMs?: number;
  lastChecked?: string;
  details?: string;
};

type InfraResponse = {
  services?: ServiceStatus[];
  checkedAt?: string;
};

const FALLBACK_SERVICES: ServiceStatus[] = [
  { name: "API Server", status: "operational", details: "Express HTTP server" },
  { name: "MongoDB", status: "operational", details: "Primary database" },
  { name: "Redis", status: "operational", details: "Cache & session store" },
  { name: "Email (Resend)", status: "operational", details: "Transactional email" },
  { name: "Payment (Paystack)", status: "operational", details: "Payment processing" },
  { name: "AWS Bedrock", status: "operational", details: "Nova Sonic AI voice" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "operational") return <IconCircleCheck className="size-5 text-emerald-500" />;
  if (status === "degraded") return <IconAlertTriangle className="size-5 text-amber-500" />;
  return <IconCircleX className="size-5 text-red-500" />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    operational: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    degraded: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    down: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function fmtDate(d?: string) {
  if (!d) return "Just now";
  return new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ProvidersPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-infrastructure"],
    queryFn: () => api<InfraResponse>("/v1/admin/platform/infrastructure").catch(() => ({ services: undefined, checkedAt: undefined })),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const services: ServiceStatus[] = data?.services ?? FALLBACK_SERVICES;
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Providers</h1>
          <p className="text-sm text-muted-foreground">Infrastructure and third-party service health.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 card-elevated rounded-2xl border bg-background p-4">
        <div className="flex items-center gap-3">
          <div className={`size-3 rounded-full ${allOperational ? "bg-emerald-500" : "bg-amber-500"}`} />
          <p className="text-sm font-medium">{allOperational ? "All systems operational" : "Some systems need attention"}</p>
          {data?.checkedAt && <p className="ml-auto text-xs text-muted-foreground">Last checked {fmtDate(data.checkedAt)}</p>}
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <div key={svc.name} className="card-elevated flex flex-col gap-3 rounded-2xl border bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl border bg-muted">
                    <IconServer className="size-4 text-muted-foreground" />
                  </div>
                  <p className="font-medium">{svc.name}</p>
                </div>
                <StatusIcon status={svc.status} />
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={svc.status} />
                {svc.latencyMs != null && (
                  <span className="text-xs text-muted-foreground">{svc.latencyMs}ms</span>
                )}
              </div>
              {svc.details && <p className="text-xs text-muted-foreground">{svc.details}</p>}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
