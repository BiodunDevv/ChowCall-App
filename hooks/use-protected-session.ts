"use client";

import { useEffect } from "react";
import { usePathname, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
	authApi,
	getTenantScopedPath,
	getUserTenantSlug,
	isSuperAdmin,
} from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import { useAuthStore } from "@/stores/auth-store";

export function useProtectedSession() {
	const pathname = usePathname();
	const params = useParams<{ tenant?: string }>();
	const storedUser = useAuthStore((state) => state.user);
	const setUser = useAuthStore((state) => state.setUser);

	const session = useQuery({
		queryKey: ["auth-me"],
		queryFn: () => authApi.me(),
		retry: false,
		staleTime: 1000 * 60,
	});

	useEffect(() => {
		const user = session.data?.user;
		if (!user) return;

		setUser(user);

		const rootOrigin = getRootOrigin();

		if (isSuperAdmin(user)) {
			if (!pathname.startsWith("/super-admin")) {
				window.location.replace(`${rootOrigin}/super-admin/dashboard`);
			}
			return;
		}

		// Non-admin on a super-admin path → send to their dashboard
		const userTenantSlug = getUserTenantSlug(user);
		if (pathname.startsWith("/super-admin") && userTenantSlug) {
			window.location.replace(getTenantScopedPath(userTenantSlug, "/dashboard"));
			return;
		}

		// Wrong tenant slug in URL → redirect to the correct tenant's dashboard
		const urlTenant = params?.tenant;
		if (urlTenant && userTenantSlug && urlTenant !== userTenantSlug) {
			window.location.replace(getTenantScopedPath(userTenantSlug, "/dashboard"));
		}
	}, [params?.tenant, pathname, session.data?.user, setUser]);

	return {
		isCheckingSession: session.isPending && !storedUser,
		sessionUser: session.data?.user ?? storedUser,
	};
}
