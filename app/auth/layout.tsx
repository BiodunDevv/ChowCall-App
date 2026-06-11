"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getPostAuthPath } from "@/lib/auth";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		if (!user) return;
		const dest = getPostAuthPath(user);
		// Absolute URLs (super admin crossing from subdomain) need full navigation
		if (dest.startsWith("http")) {
			window.location.replace(dest);
		} else {
			router.replace(dest);
		}
	}, [user, router]);

	// Render nothing while redirecting to avoid flash
	if (user) return null;

	return <>{children}</>;
}
