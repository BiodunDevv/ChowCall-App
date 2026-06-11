"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { authApi, getTenantScopedPath } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard/dashboard";
import { BalanceWidget } from "@/components/tenant/balance-widget";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type OnboardingStatus = {
	data?: {
		onboarding?: { status?: string };
		subscriptionStatus?: string;
	};
};

export function TenantDashboard({ tenant }: { tenant: string }) {
	const router = useRouter();

	const { data: meData, isLoading: meLoading } = useQuery({
		queryKey: ["auth", "me"],
		queryFn: authApi.me,
		retry: false,
	});

	// Fetch onboarding + subscription state to decide if the user may enter
	const { data: onboardingData, isLoading: onboardingLoading } =
		useQuery({
			queryKey: ["onboarding-status", tenant],
			queryFn: () => api<OnboardingStatus>("/v1/onboarding"),
			retry: false,
			enabled: !meLoading,
		});

	const isLoading = meLoading || onboardingLoading;

	useEffect(() => {
		if (isLoading) return;

		const status = onboardingData?.data?.onboarding?.status;
		const subscriptionStatus = onboardingData?.data?.subscriptionStatus;

		// Not finished onboarding — send them back
		if (status !== "live") {
			router.replace(getTenantScopedPath(tenant, "/onboarding"));
			return;
		}

		// Finished onboarding but haven't paid — send to plan selection
		if (subscriptionStatus !== "active") {
			router.replace(getTenantScopedPath(tenant, "/billing/plan"));
		}
	}, [isLoading, onboardingData, tenant, router]);

	if (isLoading) return <LogoLoadingScreen fixed={false} />;

	const status = onboardingData?.data?.onboarding?.status;
	const subscriptionStatus = onboardingData?.data?.subscriptionStatus;

	// Still waiting for redirect — keep showing loading to avoid flash
	if (status !== "live" || subscriptionStatus !== "active") {
		return <LogoLoadingScreen fixed={false} />;
	}

	const tenantName = tenant
		.split("-")
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(" ");

	return (
		<AppShell>
			<div className="mb-6 space-y-1">
				<p className="text-sm text-muted-foreground">Tenant workspace</p>
				<h1 className="font-semibold text-2xl tracking-tight">{tenantName}</h1>
			</div>
			<BalanceWidget />
			<Dashboard />
		</AppShell>
	);
}
