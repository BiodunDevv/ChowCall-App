"use client";

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconServer, IconDatabase, IconCircleCheck, IconCircleX } from "@tabler/icons-react";

type ServiceStatus = "operational" | "degraded" | "down";

const SERVICES = [
  { name: "API Server", region: "Africa / Lagos", status: "operational" as ServiceStatus },
  { name: "MongoDB Atlas", region: "AWS ap-south-1", status: "operational" as ServiceStatus },
  { name: "Redis Cache", region: "Redis Cloud EU", status: "operational" as ServiceStatus },
  { name: "Brevo Email", region: "EU", status: "operational" as ServiceStatus },
  { name: "Paystack Gateway", region: "Nigeria", status: "operational" as ServiceStatus },
  { name: "AI Call Agent", region: "Azure UAE North", status: "degraded" as ServiceStatus },
];

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === "operational") {
    return (
      <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
        <IconCircleCheck className="size-3" />
        Operational
      </Badge>
    );
  }
  if (status === "degraded") {
    return (
      <Badge className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
        <IconCircleX className="size-3" />
        Degraded
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <IconCircleX className="size-3" />
      Down
    </Badge>
  );
}

export function InfrastructureSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconServer className="size-4" />
          Infrastructure Health
        </CardTitle>
        <CardDescription>
          Live status of all platform services and integrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {SERVICES.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <IconDatabase className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">{svc.region}</p>
                </div>
              </div>
              <StatusBadge status={svc.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
