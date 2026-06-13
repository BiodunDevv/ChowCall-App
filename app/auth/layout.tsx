"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { authApi, getPostAuthPath } from "@/lib/auth";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const queryClient = useQueryClient();
	const user = useAuthStore((state) => state.user);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const session = useQuery({
		queryKey: ["auth-me"],
		queryFn: () => authApi.me(),
		enabled: Boolean(user),
		retry: false,
		staleTime: 0,
	});

	useEffect(() => {
		if (!user || !session.data?.user) return;
		const dest = getPostAuthPath(session.data.user);
		// Always hard-navigate to flush stale cache — critical for super-admin
		queryClient.clear();
		window.location.replace(dest.startsWith("http") ? dest : window.location.origin + dest);
	}, [session.data?.user, user, queryClient]);

	useEffect(() => {
		if (session.isError) clearAuth();
	}, [clearAuth, session.isError]);

	// Render nothing while redirecting to avoid flash
	if (user && session.isPending) return null;

	return <>{children}</>;
}
