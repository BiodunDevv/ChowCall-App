import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconShoppingCart, IconPlus, IconMinus, IconTrash,
  IconLoader, IconCircleCheck, IconShieldCheck,
} from "@tabler/icons-react";
import { formatMoney } from "@/lib/public-ordering";
import type { CartLine, CustomerDetails } from "./order-types";

type Pricing = {
  itemSubtotal?: number;
  deliveryFee?: number;
  serviceFee?: number;
  totalPayable?: number;
} | undefined;

type OrderCartPanelProps = {
  cart: CartLine[];
  customer: CustomerDetails;
  fulfilmentType: "pickup" | "delivery";
  pricing: Pricing;
  checkoutPending: boolean;
  canCheckout: boolean;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onCustomerChange: (field: keyof CustomerDetails, value: string) => void;
  onCheckout: () => void;
};

export function OrderCartPanel({
  cart, customer, fulfilmentType, pricing,
  checkoutPending, canCheckout,
  onIncrement, onDecrement, onRemove, onCustomerChange, onCheckout,
}: OrderCartPanelProps) {
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const displayTotal = pricing?.totalPayable ?? cartTotal;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <IconShoppingCart className="size-4 text-muted-foreground" />
        <h2 className="font-semibold">Your order</h2>
        {cart.length > 0 && (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            {cart.reduce((s, l) => s + l.quantity, 0)}
          </span>
        )}
      </div>

      {cart.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col gap-0 divide-y overflow-y-auto">
          {/* Items */}
          <div className="space-y-1 p-4">
            {cart.map((line) => (
              <CartItem
                key={line.id}
                line={line}
                onIncrement={() => onIncrement(line.id)}
                onDecrement={() => onDecrement(line.id)}
                onRemove={() => onRemove(line.id)}
              />
            ))}
          </div>

          {/* Customer details */}
          <div className="space-y-2.5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Your details
            </p>
            <Field label="Name" placeholder="Full name" value={customer.name} onChange={(v) => onCustomerChange("name", v)} />
            <Field label="Phone" placeholder="+234 800 000 0000" value={customer.phone} onChange={(v) => onCustomerChange("phone", v)} type="tel" />
            <Field label="Email" placeholder="you@example.com" value={customer.email} onChange={(v) => onCustomerChange("email", v)} type="email" />
            {fulfilmentType === "delivery" && (
              <>
                <Field label="Delivery address" placeholder="Street address" value={customer.address} onChange={(v) => onCustomerChange("address", v)} />
                <Field label="Landmark" placeholder="Nearest landmark" value={customer.landmark} onChange={(v) => onCustomerChange("landmark", v)} />
              </>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-2 p-4 text-sm">
            <PricingRow label="Subtotal" value={formatMoney(pricing?.itemSubtotal ?? cartTotal)} />
            {fulfilmentType === "delivery" && (
              <PricingRow
                label="Delivery fee"
                value={pricing?.deliveryFee != null ? formatMoney(pricing.deliveryFee) : "Calculated at checkout"}
                muted={pricing?.deliveryFee == null}
              />
            )}
            <PricingRow
              label="Service fee"
              value={pricing?.serviceFee != null ? formatMoney(pricing.serviceFee) : "—"}
            />
            <div className="flex items-center justify-between border-t pt-2 font-bold text-base">
              <span>Total</span>
              <span>{formatMoney(displayTotal)}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-2 p-4">
            <Button
              className="w-full gap-2 rounded-full"
              size="lg"
              disabled={!canCheckout || checkoutPending}
              onClick={onCheckout}
            >
              {checkoutPending ? (
                <IconLoader className="size-4 animate-spin" />
              ) : (
                <IconCircleCheck className="size-4" />
              )}
              {checkoutPending ? "Processing…" : "Confirm & Pay"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <IconShieldCheck className="size-3.5" />
              Secured by Paystack · Flutterwave
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border bg-muted">
        <IconShoppingCart className="size-6 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium">Your order is empty</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Browse the menu and add items to start</p>
      </div>
    </div>
  );
}

function CartItem({ line, onIncrement, onDecrement, onRemove }: {
  line: CartLine;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl py-1.5 text-sm">
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 px-1.5 py-1">
        <button type="button" onClick={onDecrement} className="flex size-5 items-center justify-center rounded-md hover:bg-muted">
          <IconMinus className="size-2.5 text-muted-foreground" />
        </button>
        <span className="min-w-[1rem] text-center text-xs font-semibold">{line.quantity}</span>
        <button type="button" onClick={onIncrement} className="flex size-5 items-center justify-center rounded-md hover:bg-muted">
          <IconPlus className="size-2.5 text-muted-foreground" />
        </button>
      </div>
      <span className="flex-1 truncate font-medium">{line.name}</span>
      <span className="shrink-0 text-xs font-semibold">{formatMoney(line.unitPrice * line.quantity)}</span>
      <button type="button" onClick={onRemove} className="text-muted-foreground/50 transition-colors hover:text-destructive">
        <IconTrash className="size-3.5" />
      </button>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}

function PricingRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between", muted && "text-muted-foreground/60")}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", muted && "text-xs italic")}>{value}</span>
    </div>
  );
}

