"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { AuthShell } from "@/components/Auth/auth-shell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordPage() {
	const searchParams = useSearchParams();
	const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
	const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
	const [form, setForm] = useState({
		password: "",
		confirmPassword: "",
		token,
		email,
	});

	const mutation = useMutation({
		mutationFn: () => {
			if (form.password !== form.confirmPassword) {
				throw new Error("Passwords do not match.");
			}

			return authApi.resetPassword(form);
		},
		onSuccess: () => {
			toast.success("Password updated! You can now sign in.");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Could not update password. The link may have expired.");
		},
	});

	return (
		<AuthShell>
			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					mutation.mutate();
				}}
			>
				<div className="space-y-1">
					<h1 className="font-bold text-2xl tracking-wide">Create a new password</h1>
					<p className="text-base text-muted-foreground">
						Use the reset code from your email and choose a secure password.
					</p>
				</div>

				<div>
					<Label htmlFor="token">Reset token</Label>
					<Input
						className="mt-1.5"
						id="token"
						placeholder="Paste reset token"
						required
						value={form.token}
						onChange={(event) =>
							setForm((current) => ({ ...current, token: event.target.value }))
						}
					/>
				</div>
				<div>
					<Label htmlFor="password">New password</Label>
					<Input
						autoComplete="new-password"
						className="mt-1.5"
						id="password"
						required
						type="password"
						value={form.password}
						onChange={(event) =>
							setForm((current) => ({ ...current, password: event.target.value }))
						}
					/>
				</div>
				<div>
					<Label htmlFor="confirmPassword">Confirm password</Label>
					<Input
						autoComplete="new-password"
						className="mt-1.5"
						id="confirmPassword"
						required
						type="password"
						value={form.confirmPassword}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								confirmPassword: event.target.value,
							}))
						}
					/>
				</div>

				{mutation.isSuccess ? (
					<p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
						Your password has been updated. You can now sign in.
					</p>
				) : null}

				{mutation.error ? (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				) : null}

				<Button className="w-full" disabled={mutation.isPending} type="submit">
					{mutation.isPending ? "Updating password..." : "Update password"}
				</Button>
				<p className="text-center text-sm text-muted-foreground">
					<Link className="text-foreground underline" href="/auth/signin">
						Back to sign in
					</Link>
				</p>
			</form>
		</AuthShell>
	);
}
