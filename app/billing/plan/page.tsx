"use client";

/**
 * Top-level /billing/plan catch-all.
 *
 * Paystack / Flutterwave can redirect here when the backend couldn't resolve
 * the tenant slug yet (e.g. first-load, no cookie). We read the auth cookie
 * to find the tenant slug and bounce the user to the correct
 * /{tenantSlug}/billing/plan?reference=... page.
 *
 * If they are not logged in we send them to sign-in.
 */

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi, getTenantScopedPath, getUserTenantSlug, isSuperAdmin } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";

export default function BillingPlanCatchAll() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Paystack sends ?reference=, Flutterwave sends ?tx_ref=
  const reference = searchParams.get("reference") ?? searchParams.get("tx_ref") ?? "";
  const txRef = searchParams.get("tx_ref") ?? "";

  const { data, isError } = useQuery({
    queryKey: ["auth-me-billing"],
    queryFn: () => authApi.me(),
    retry: false,
  });

  useEffect(() => {
    if (!data && !isError) return; // still loading

    const user = data?.user;

    if (!user || isError) {
      // Not logged in — send to sign-in, preserve reference in next param
      const qs = reference ? `?next=${encodeURIComponent(`/billing/plan?reference=${reference}`)}` : "";
      window.location.replace(`${getRootOrigin()}/auth/signin${qs}`);
      return;
    }

    if (isSuperAdmin(user)) {
      window.location.replace(`${getRootOrigin()}/super-admin/dashboard`);
      return;
    }

    const tenantSlug = getUserTenantSlug(user);
    if (!tenantSlug) {
      // No tenant attached to this user yet
      window.location.replace(`${getRootOrigin()}/auth/signin`);
      return;
    }

    // Build the correct destination with the payment reference
    let dest = getTenantScopedPath(tenantSlug, "/billing/plan");
    const params = new URLSearchParams();
    if (reference) params.set("reference", reference);
    if (txRef && txRef !== reference) params.set("tx_ref", txRef);
    const qs = params.toString();
    if (qs) dest += `?${qs}`;

    router.replace(dest);
  }, [data, isError, reference, txRef, router]);

  return <LogoLoadingScreen />;
}
