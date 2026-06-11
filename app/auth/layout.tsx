"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { authApi, getPostAuthPath } from "@/lib/auth";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const session = useQuery({
		queryKey: ["auth-me"],
		queryFn: () => authApi.me(),
		enabled: Boolean(user),
		retry: false,
	});

	useEffect(() => {
		if (!user || !session.data?.user) return;
		const dest = getPostAuthPath(session.data.user);
		// Absolute URLs (super admin crossing from subdomain) need full navigation
		if (dest.startsWith("http")) {
			window.location.replace(dest);
		} else {
			router.replace(dest);
		}
	}, [session.data?.user, user, router]);

	useEffect(() => {
		if (session.isError) clearAuth();
	}, [clearAuth, session.isError]);

	// Render nothing while redirecting to avoid flash
	if (user && session.isPending) return null;

	return <>{children}</>;
}
