"use client";

import { AppShell } from "@/components/app-shell";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { authApi } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard/dashboard";
import { useQuery } from "@tanstack/react-query";

export function SuperAdminDashboard() {
	const { isLoading } = useQuery({
		queryKey: ["auth", "me"],
		queryFn: authApi.me,
		retry: false,
	});

	if (isLoading) return <LogoLoadingScreen fixed={false} />;

	return (
		<AppShell>
			<div className="mb-6 min-w-0 space-y-1">
				<p className="text-sm text-muted-foreground">Platform operations</p>
				<h1 className="truncate font-semibold text-2xl tracking-tight">
					Super admin dashboard
				</h1>
			</div>
			<div className="min-w-0 overflow-hidden">
				<Dashboard />
			</div>
		</AppShell>
	);
}
