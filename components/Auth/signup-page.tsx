"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, getPostAuthPath, getTenantUrlPreview, slugifyTenant } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { AuthShell } from "@/components/Auth/auth-shell";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = [
	["name", "Your name", "Amina Bello", "text"],
	["email", "Work email", "amina@restaurant.com", "email"],
	["phone", "Phone number", "0803 123 4567", "tel"],
	["tenantName", "Restaurant name", "Amina's Kitchen", "text"],
	["password", "Password", "At least 8 characters", "password"],
	["confirmPassword", "Confirm password", "Repeat your password", "password"],
] as const;

export function SignUpPage() {
	const router = useRouter();
	const setUser = useAuthStore((state) => state.setUser);
	const setTokens = useAuthStore((state) => state.setTokens);
	const setPendingOtp = useAuthStore((state) => state.setPendingOtp);
	const [form, setForm] = useState<Record<string, string>>({});

	const tenantUrlPreview = useMemo(
		() => getTenantUrlPreview(form.slug ?? ""),
		[form.slug],
	);

	const mutation = useMutation({
		mutationFn: () => {
			if (form.password !== form.confirmPassword) {
				throw new Error("Passwords do not match.");
			}

			return authApi.register({
				name: form.name ?? "",
				email: form.email ?? "",
				phone: form.phone,
				tenantName: form.tenantName ?? "",
				slug: slugifyTenant(form.slug ?? form.tenantName ?? ""),
				password: form.password ?? "",
				twoFactorEnabled: true,
			});
		},
		onSuccess: (response) => {
			if (response.requiresOtp) {
				setPendingOtp({
					email: form.email ?? "",
					loginToken: response.loginToken ?? null,
					tenantSlug: response.user?.tenantSlug ?? response.tenant?.slug ?? form.slug ?? null,
				});
				toast.info("Account created! Check your email for a verification code.");
				router.push("/auth/verify-otp");
				return;
			}

			if (response.user) {
				setUser(response.user);
				if (response.accessToken) setTokens(response.accessToken);
				toast.success("Account created! Let's set up your restaurant.");
				const dest = getPostAuthPath(response.user, response.accessToken);
				if (dest.startsWith("http")) {
					window.location.replace(dest);
				} else {
					router.push(dest);
				}
				return;
			}

			router.push("/auth/signin");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Could not create account. Please try again.");
		},
	});

	return (
		<AuthShell
			quote="Lunch rush is easier when every caller gets an answer and the kitchen only receives clear, paid orders."
			quoteAuthor="ChowCall Kitchen Demo"
		>
			{mutation.isPending ? <LogoLoadingScreen /> : null}
			<form
				className="max-h-[calc(100vh-8.5rem)] space-y-5 overflow-y-auto pr-1 sm:max-h-[calc(100vh-9rem)] lg:max-h-[calc(100vh-10rem)]"
				onSubmit={(event) => {
					event.preventDefault();
					mutation.mutate();
				}}
			>
				<div className="flex flex-col space-y-1">
					<h1 className="font-bold text-2xl tracking-tight">
						Create your account
					</h1>
					<p className="text-base text-muted-foreground">
						Start with your account details, then set up your restaurant step by step.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					{fields.map(([name, label, placeholder, type], index) => (
						<div className={index < 4 ? "sm:col-span-2" : ""} key={name}>
							<Label htmlFor={name}>{label}</Label>
							<Input
								className="mt-1.5 h-11 rounded-lg"
								id={name}
								placeholder={placeholder}
								required
								type={type}
								value={form[name] ?? ""}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										[name]: event.target.value,
										...(name === "tenantName" && !current.slug
											? { slug: slugifyTenant(event.target.value) }
											: {}),
									}))
								}
							/>
						</div>
					))}
				</div>

				<div className="rounded-xl border bg-card p-4">
					<Label htmlFor="slug">Tenant URL slug</Label>
					<Input
						className="mt-1.5 h-11 rounded-lg"
						id="slug"
						placeholder="chow"
						required
						value={form.slug ?? ""}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								slug: slugifyTenant(event.target.value),
							}))
						}
					/>
					<p className="mt-2 text-sm text-muted-foreground">
						Your restaurant landing page will be available at{" "}
						<span className="font-medium text-foreground">
							{tenantUrlPreview}
						</span>
						.
					</p>
				</div>

				<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
					Two-factor authentication is enabled by default. You will enter an OTP code every time you log in.
				</div>

				{mutation.error ? (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				) : null}

				<Button className="h-11 w-full" disabled={mutation.isPending} type="submit">
					{mutation.isPending ? "Creating account..." : "Create account"}
				</Button>
				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link className="text-foreground underline" href="/auth/signin">
						Sign in
					</Link>
				</p>
				<p className="text-muted-foreground text-xs">
					By creating an account, you agree to ChowCall&apos;s Terms of Service and Privacy Policy.
				</p>
			</form>
		</AuthShell>
	);
}
