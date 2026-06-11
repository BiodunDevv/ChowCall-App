"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AuthShell } from "@/components/Auth/auth-shell";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { authApi, getPostAuthPath } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import { IconAt, IconLock, IconShieldCheck } from "@tabler/icons-react";
import { toast } from "sonner";

export function SignInPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setPendingOtp = useAuthStore((state) => state.setPendingOtp);
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: (response) => {
      if (response.requiresOtp) {
        setPendingOtp({
          email: form.email,
          loginToken: response.loginToken ?? null,
          tenantSlug:
            response.user?.tenantSlug ?? response.tenant?.slug ?? null,
        });
        toast.info("Check your email for a verification code.");
        router.push("/auth/verify-otp");
        return;
      }

      if (response.user) {
        setUser(response.user);
        if (response.accessToken) setTokens(response.accessToken);
        toast.success(`Welcome back, ${response.user.name.split(" ")[0]}!`);
        const dest = getPostAuthPath(response.user, response.accessToken);
        if (dest.startsWith("http")) {
          window.location.replace(dest);
        } else {
          router.push(dest);
        }
        return;
      }

      router.push("/onboarding");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Sign in failed. Check your credentials.");
    },
  });

  return (
    <AuthShell>
      {mutation.isPending ? <LogoLoadingScreen /> : null}
      <div className="flex flex-col space-y-1">
        <h1 className="font-bold text-2xl tracking-tight">Welcome back</h1>
        <p className="text-base text-muted-foreground">
          Sign in to continue to your ChowCall account.
        </p>
      </div>

      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <p className="text-start text-muted-foreground text-xs">
            Enter your email address to sign in
          </p>
          <InputGroup>
            <InputGroupInput
              autoComplete="email"
              className="h-11 rounded-lg"
              placeholder="your.email@example.com"
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            <InputGroupAddon align="inline-start">
              <IconAt />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-start text-muted-foreground text-xs">
              Enter your password
            </p>
            <Link
              className="text-xs text-foreground underline underline-offset-4"
              href="/auth/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <InputGroup>
            <InputGroupInput
              autoComplete="current-password"
              className="h-11 rounded-lg"
              placeholder="Your password"
              required
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
            <InputGroupAddon align="inline-start">
              <IconLock />
            </InputGroupAddon>
          </InputGroup>
        </div>

        {mutation.error ? (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        ) : null}

        <div className="rounded-lg border bg-muted/35 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <IconShieldCheck className="size-4" />
            OTP protected access
          </div>
          <p className="mt-1 text-xs">
            Tenant and platform accounts continue through verification when required.
          </p>
        </div>

        <Button className="h-11 w-full" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Checking account..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to ChowCall?{" "}
        <Link className="text-foreground underline" href="/auth/signup">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
