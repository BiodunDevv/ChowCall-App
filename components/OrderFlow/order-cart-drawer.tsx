"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconPlus, IconMinus, IconX,
  IconLoader, IconCircleCheck, IconShieldCheck,
} from "@tabler/icons-react";
import { formatMoney } from "@/lib/public-ordering";
import type { CartLine, CustomerDetails } from "./order-types";

type Pricing = { itemSubtotal?: number; deliveryFee?: number; serviceFee?: number; totalPayable?: number } | undefined;

type OrderCartDrawerProps = {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  customer: CustomerDetails;
  fulfilmentType: "pickup" | "delivery";
  pricing: Pricing;
  checkoutPending: boolean;
  canCheckout: boolean;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onCustomerChange: (field: keyof CustomerDetails, value: string) => void;
  onCheckout: () => void;
};

export function OrderCartDrawer({
  open, onClose,
  cart, customer, fulfilmentType, pricing,
  checkoutPending, canCheckout,
  onIncrement, onDecrement, onCustomerChange, onCheckout,
}: OrderCartDrawerProps) {
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const displayTotal = pricing?.totalPayable ?? cartTotal;

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex max-h-[90dvh] flex-col rounded-t-3xl bg-background">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 pb-3 pt-1">
          <h2 className="font-semibold">Your order</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 pt-3 space-y-4">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No items yet — add from the menu below
            </p>
          ) : (
            <>
              {/* Cart items */}
              <div className="space-y-2">
                {cart.map((line) => (
                  <div key={line.id} className="flex items-center gap-2.5 rounded-xl border bg-muted/30 px-3 py-2.5 text-sm">
                    <span className="flex-1 font-medium truncate">{line.name}</span>
                    <span className="shrink-0 text-muted-foreground text-xs">{formatMoney(line.unitPrice)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDecrement(line.id)}
                        className="flex size-6 items-center justify-center rounded-full border bg-background"
                      >
                        <IconMinus className="size-2.5" />
                      </button>
                      <span className="min-w-[1rem] text-center text-xs font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onIncrement(line.id)}
                        className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <IconPlus className="size-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer details */}
              <div className="space-y-2.5 rounded-2xl border bg-muted/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your details</p>
                <DrawerField label="Name" placeholder="Full name" value={customer.name} onChange={(v) => onCustomerChange("name", v)} />
                <DrawerField label="Phone" placeholder="+234 800 000 0000" value={customer.phone} onChange={(v) => onCustomerChange("phone", v)} type="tel" />
                <DrawerField label="Email" placeholder="you@example.com" value={customer.email} onChange={(v) => onCustomerChange("email", v)} type="email" />
                {fulfilmentType === "delivery" && (
                  <>
                    <DrawerField label="Delivery address" placeholder="Street address" value={customer.address} onChange={(v) => onCustomerChange("address", v)} />
                    <DrawerField label="Landmark" placeholder="Nearest landmark" value={customer.landmark} onChange={(v) => onCustomerChange("landmark", v)} />
                  </>
                )}
              </div>

              {/* Pricing */}
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2 text-sm">
                <PricingRow label="Subtotal" value={formatMoney(pricing?.itemSubtotal ?? cartTotal)} />
                {fulfilmentType === "delivery" && (
                  <PricingRow label="Delivery" value={pricing?.deliveryFee != null ? formatMoney(pricing.deliveryFee) : "Calculated"} />
                )}
                <PricingRow label="Service fee" value={pricing?.serviceFee != null ? formatMoney(pricing.serviceFee) : "—"} />
                <div className="flex justify-between border-t pt-2 font-bold text-base">
                  <span>Total</span>
                  <span>{formatMoney(displayTotal)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="border-t bg-background p-4 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="w-full gap-2 rounded-full"
            size="lg"
            disabled={!canCheckout || checkoutPending}
            onClick={() => { onClose(); onCheckout(); }}
          >
            {checkoutPending ? <IconLoader className="size-4 animate-spin" /> : <IconCircleCheck className="size-4" />}
            {checkoutPending ? "Processing…" : "Confirm & Pay"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <IconShieldCheck className="size-3.5" />
            Secured by Paystack · Flutterwave
          </p>
        </div>
      </div>
    </div>
  );
}

function DrawerField({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm bg-background" />
    </div>
  );
}

function PricingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
