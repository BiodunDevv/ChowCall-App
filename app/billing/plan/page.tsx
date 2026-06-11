"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi, getTenantScopedPath, getUserTenantSlug, isSuperAdmin } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";

function BillingPlanRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference = searchParams.get("reference") ?? searchParams.get("tx_ref") ?? "";
  const txRef = searchParams.get("tx_ref") ?? "";

  const { data, isError } = useQuery({
    queryKey: ["auth-me-billing"],
    queryFn: () => authApi.me(),
    retry: false,
  });

  useEffect(() => {
    if (!data && !isError) return;

    const user = data?.user;

    if (!user || isError) {
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
      window.location.replace(`${getRootOrigin()}/auth/signin`);
      return;
    }

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

export default function BillingPlanCatchAll() {
  return (
    <Suspense fallback={<LogoLoadingScreen />}>
      <BillingPlanRedirect />
    </Suspense>
  );
}
