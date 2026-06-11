"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { IconArrowRight, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react";
import { api } from "@/lib/api/client";
import { useParams } from "next/navigation";

type SubStatus = {
	data: {
		subscriptionStatus?: string;
		subscribedPlan?: string;
		subscriptionExpiresAt?: string | null;
	};
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
	active: "default",
	trial: "secondary",
	unpaid: "destructive",
	cancelled: "destructive",
};

export function BillingHealth() {
	const params = useParams<{ tenant?: string }>();
	const tenant = params?.tenant ?? "";

	const { data, isLoading } = useQuery({
		queryKey: ["subscriptions", "status"],
		queryFn: () => api<SubStatus>("/v1/subscriptions/status"),
		staleTime: 120_000,
	});

	const status = data?.data?.subscriptionStatus ?? "unknown";
	const plan = data?.data?.subscribedPlan ?? data?.data?.subscriptionStatus ?? "—";
	const expiresAt = data?.data?.subscriptionExpiresAt;
	const isHealthy = status === "active" || status === "trial";

	return (
		<DashboardCard className="gap-0">
			<CardHeader className="border-b">
				<CardTitle className="text-balance text-base">Billing Health</CardTitle>
				<CardDescription className="text-pretty">
					Subscription status and plan details.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex h-full flex-col gap-4 pt-5">
				{isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				) : (
					<>
						<div className="flex items-center gap-3">
							{isHealthy ? (
								<IconCircleCheck className="size-6 text-green-500" />
							) : (
								<IconAlertCircle className="size-6 text-destructive" />
							)}
							<div>
								<p className="text-sm font-medium capitalize">{plan} Plan</p>
								<div className="mt-0.5">
									<Badge variant={STATUS_VARIANT[status] ?? "outline"} className="text-xs capitalize">
										{status}
									</Badge>
								</div>
							</div>
						</div>
						{expiresAt && (
							<p className="text-xs text-muted-foreground">
								Expires {new Date(expiresAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
							</p>
						)}
						{!isHealthy && (
							<Button asChild variant="outline" size="sm">
								<a href={tenant ? `/${tenant}/billing/plan` : "/billing/plan"}>
									Upgrade Plan
									<IconArrowRight aria-hidden="true" />
								</a>
							</Button>
						)}
					</>
				)}
			</CardContent>
		</DashboardCard>
	);
}
