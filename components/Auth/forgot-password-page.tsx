"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { AuthShell } from "@/components/Auth/auth-shell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const mutation = useMutation({
		mutationFn: () => authApi.forgotPassword(email),
		onSuccess: () => {
			toast.success("Reset instructions sent. Check your email.");
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Could not send reset instructions.");
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
					<h1 className="font-bold text-2xl tracking-wide">Reset your password</h1>
					<p className="text-base text-muted-foreground">
						Enter your email and we&apos;ll send instructions to help you get back in.
					</p>
				</div>

				<div>
					<Label htmlFor="email">Work email</Label>
					<Input
						autoComplete="email"
						className="mt-1.5"
						id="email"
						placeholder="your.email@example.com"
						required
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</div>

				{mutation.isSuccess ? (
					<p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
						If an account exists for this email, password reset instructions have been sent.
					</p>
				) : null}

				{mutation.error ? (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				) : null}

				<Button className="w-full" disabled={mutation.isPending} type="submit">
					{mutation.isPending ? "Sending..." : "Send reset instructions"}
				</Button>
				<p className="text-center text-sm text-muted-foreground">
					Remember your password?{" "}
					<Link className="text-foreground underline" href="/auth/signin">
						Sign in
					</Link>
				</p>
			</form>
		</AuthShell>
	);
}
