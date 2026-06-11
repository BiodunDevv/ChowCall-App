"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconArrowRight, IconReceipt } from "@tabler/icons-react";

type TenantTrackOrderProps = {
  tenantSlug: string;
};

export function TenantTrackOrder({ tenantSlug }: TenantTrackOrderProps) {
  const [ref, setRef] = useState("");

  function track() {
    const id = ref.trim();
    if (!id) return;
    window.location.href = `/order/${tenantSlug}/status/${encodeURIComponent(id)}`;
  }

  return (
    <section className="border-b bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <IconReceipt className="size-3" />
            Order tracking
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Already ordered? Track it.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter your order reference or ID to see your current order status.
          </p>
          <div className="mt-6 flex gap-2">
            <Input
              className="flex-1"
              placeholder="Enter order reference…"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && track()}
            />
            <Button onClick={track} className="gap-1.5 rounded-full shrink-0">
              Track
              <IconArrowRight className="size-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your reference was sent to you via SMS or WhatsApp after payment.
          </p>
        </div>
      </div>
    </section>
  );
}
