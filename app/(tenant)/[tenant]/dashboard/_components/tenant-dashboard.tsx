"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { authApi, getTenantScopedPath } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard/dashboard";
import { BalanceWidget } from "@/components/tenant/balance-widget";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type OnboardingStatus = {
	data?: {
		onboarding?: { status?: string; pendingSubReference?: string };
		subscriptionStatus?: string;
	};
};

export function TenantDashboard({ tenant }: { tenant: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const autoVerifyAttempted = useRef(false);

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

	// Silently auto-verify a pending subscription payment
	const autoVerify = useMutation({
		mutationFn: (reference: string) =>
			api("/v1/subscriptions/verify", { method: "POST", body: JSON.stringify({ reference }) }),
		onSuccess: () => {
			// Re-fetch onboarding status so the dashboard unlocks without a redirect
			queryClient.invalidateQueries({ queryKey: ["onboarding-status", tenant] });
		},
		onError: () => {
			// Verification failed — fall through to billing/plan as usual
		},
	});

	const isLoading = meLoading || onboardingLoading;

	const autoVerifyMutate = autoVerify.mutate;
	const autoVerifyIsPending = autoVerify.isPending;

	useEffect(() => {
		if (isLoading) return;

		const status = onboardingData?.data?.onboarding?.status;
		const subscriptionStatus = onboardingData?.data?.subscriptionStatus;
		const pendingRef = onboardingData?.data?.onboarding?.pendingSubReference;

		// Not finished onboarding — send them back
		if (status !== "live") {
			router.replace(getTenantScopedPath(tenant, "/onboarding"));
			return;
		}

		// Subscription already active — nothing to do
		if (subscriptionStatus === "active") return;

		// If there's a pending reference and we haven't tried yet, auto-verify silently
		if (pendingRef && !autoVerifyAttempted.current && !autoVerifyIsPending) {
			autoVerifyAttempted.current = true;
			autoVerifyMutate(pendingRef);
			return; // wait for onSuccess to re-fetch before deciding to redirect
		}

		// No pending reference or already attempted — redirect to plan selection
		if (!autoVerifyIsPending) {
			router.replace(getTenantScopedPath(tenant, "/billing/plan"));
		}
	}, [isLoading, onboardingData, tenant, router, autoVerifyMutate, autoVerifyIsPending]);

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
