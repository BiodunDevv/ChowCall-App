"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, getPostAuthPath, getTenantScopedPath } from "@/lib/auth";
import { stashTokenForHandoff } from "@/lib/token";
import { useAuthStore } from "@/stores/auth-store";
import { AuthShell } from "@/components/Auth/auth-shell";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

export function VerifyOtpPage() {
	const queryClient = useQueryClient();
	const pendingOtp = useAuthStore((state) => state.pendingOtp);
	const setUser = useAuthStore((state) => state.setUser);
	const setTokens = useAuthStore((state) => state.setTokens);
	const [code, setCode] = useState("");

	const mutation = useMutation({
		mutationFn: async () => {
			const response = await authApi.verifyOtp({
				email: pendingOtp?.email ?? "",
				code,
				loginToken: pendingOtp?.loginToken ?? null,
			});
			// If the OTP response doesn't include a user object, fetch it now —
			// some backends only set a session cookie without returning user data.
			if (!response.user) {
				const me = await authApi.me();
				return { ...response, user: me.user ?? response.user };
			}
			return response;
		},
		onSuccess: (response) => {
			if (response.user) {
				setUser(response.user);
				const rawTokens = (response as unknown as Record<string, unknown>).tokens as { accessToken?: string } | undefined;
				const token = response.accessToken ?? rawTokens?.accessToken ?? null;
				if (token) {
					setTokens(token);
					stashTokenForHandoff(token);
				}
				toast.success(`Welcome, ${response.user.name.split(" ")[0]}!`);
				const dest = getPostAuthPath(response.user, token);
				queryClient.clear();
				window.location.href = dest.startsWith("http") ? dest : window.location.origin + dest;
				return;
			}

			// Absolute fallback — should not reach here with the me() call above
			const fallback = pendingOtp?.tenantSlug
				? getTenantScopedPath(pendingOtp.tenantSlug, "/onboarding")
				: "/onboarding";
			queryClient.clear();
			window.location.href = fallback.startsWith("http") ? fallback : window.location.origin + fallback;
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Invalid or expired code. Try again.");
		},
	});

	return (
		<AuthShell>
			{mutation.isPending ? <LogoLoadingScreen /> : null}
			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					mutation.mutate();
				}}
			>
				<div className="space-y-1">
					<h1 className="font-bold text-2xl tracking-wide">Enter your OTP code</h1>
					<p className="text-base text-muted-foreground">
						We sent a login code to {pendingOtp?.email || "your email address"}.
					</p>
				</div>

				<div className="flex justify-center">
					<InputOTP maxLength={6} value={code} onChange={setCode}>
						<InputOTPGroup>
							{Array.from({ length: 6 }).map((_, index) => (
								<InputOTPSlot index={index} key={index} />
							))}
						</InputOTPGroup>
					</InputOTP>
				</div>

				{mutation.error ? (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				) : null}

				<Button
					className="w-full"
					disabled={mutation.isPending || code.length < 6 || !pendingOtp?.email}
					type="submit"
				>
					{mutation.isPending ? "Verifying..." : "Verify and continue"}
				</Button>
				<p className="text-center text-sm text-muted-foreground">
					Wrong account?{" "}
					<Link className="text-foreground underline" href="/auth/signin">
						Sign in again
					</Link>
				</p>
			</form>
		</AuthShell>
	);
}
