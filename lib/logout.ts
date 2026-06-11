import { api } from "@/lib/api/client";
import { redirectToRootSignin } from "@/lib/token";

export async function logoutToRootSignin(clearAuth?: () => void) {
	try {
		await api<void>("/v1/auth/logout", { method: "POST" });
	} catch {
		// A failed logout request should not trap the user on a protected page.
	} finally {
		clearAuth?.();
		redirectToRootSignin();
	}
}
