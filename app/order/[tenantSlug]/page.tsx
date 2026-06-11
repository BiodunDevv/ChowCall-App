"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import { publicOrderingApi, type PublicMenuItem } from "@/lib/public-ordering";
import { IconToolsKitchen2 } from "@tabler/icons-react";
import {
  OrderHeader,
  OrderFulfilmentToggle,
  OrderChat,
  OrderMenu,
  OrderCartPanel,
  OrderCartDrawer,
  OrderMobileBar,
  type CartLine,
  type ChatMessage,
  type CustomerDetails,
} from "@/components/OrderFlow";

const EMPTY_CUSTOMER: CustomerDetails = {
  name: "", phone: "", email: "", address: "", landmark: "",
};

function makeCartId(item: PublicMenuItem) {
  return item._id ?? item.id ?? item.name;
}

export default function PublicAiOrderPage() {
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug ?? "";

  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery">("pickup");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────
  const menu = useQuery({
    queryKey: ["public-order-menu", tenantSlug],
    queryFn: () => publicOrderingApi.menu(tenantSlug),
    retry: false,
    enabled: Boolean(tenantSlug),
    staleTime: 5 * 60_000,
  });

  const quotePayload = useMemo(() => ({
    fulfilmentType,
    distanceKm: fulfilmentType === "delivery" ? 5 : 0,
    items: cart,
    customer,
  }), [cart, customer, fulfilmentType]);

  const quote = useQuery({
    queryKey: ["public-order-quote", tenantSlug, quotePayload],
    queryFn: () => publicOrderingApi.quote(tenantSlug, quotePayload),
    enabled: cart.length > 0,
    retry: false,
  });

  const checkout = useMutation({
    mutationFn: () =>
      publicOrderingApi.checkout(tenantSlug, {
        ...quotePayload,
        customer,
      }),
    onSuccess: (res) => {
      const url = res.data?.authorizationUrl;
      if (url) window.location.href = url;
    },
  });

  // ── Cart helpers ─────────────────────────────────────────────────────────
  function addToCart(item: PublicMenuItem) {
    const id = makeCartId(item);
    setCart((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) return prev.map((l) => l.id === id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { id, menuItemId: item._id ?? item.id, name: item.name, quantity: 1, unitPrice: item.basePrice }];
    });
    setChat((prev) => [
      ...prev,
      { role: "user", text: `Add ${item.name} to my order` },
      { role: "ai", text: `Added ${item.name} to your order. Anything else?` },
    ]);
  }

  function increment(id: string) {
    setCart((prev) => prev.map((l) => l.id === id ? { ...l, quantity: l.quantity + 1 } : l));
  }

  function decrement(id: string) {
    setCart((prev) =>
      prev.map((l) => l.id === id ? { ...l, quantity: l.quantity - 1 } : l).filter((l) => l.quantity > 0)
    );
  }

  function remove(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  function updateCustomer(field: keyof CustomerDetails, value: string) {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  }

  function handleChat(text: string) {
    setChat((prev) => [
      ...prev,
      { role: "user", text },
      { role: "ai", text: "Got it! Browse the menu below and add items. I'll confirm everything before you pay." },
    ]);
  }

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const pricing = quote.data?.data?.pricing as {
    itemSubtotal?: number; deliveryFee?: number; serviceFee?: number; totalPayable?: number;
  } | undefined;

  const canCheckout =
    cart.length > 0 &&
    Boolean(customer.name) &&
    Boolean(customer.phone) &&
    Boolean(customer.email);

  // ── Loading / error states ────────────────────────────────────────────────
  if (menu.isLoading) return <LogoLoadingScreen />;

  if (menu.isError || !menu.data?.tenant) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <FloatingPaths position={1} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-muted">
            <IconToolsKitchen2 className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Ordering not available</h1>
          <p className="text-muted-foreground">This restaurant isn't accepting AI orders yet.</p>
          <Button asChild className="rounded-full">
            <a href={getRootOrigin()}>Go to ChowCall</a>
          </Button>
        </div>
      </main>
    );
  }

  const restaurant = menu.data.tenant;
  const menuItems = menu.data.data;
  const menuHref = getPublicTenantPath(tenantSlug, "menu");

  // Group by category
  const grouped = new Map<string, PublicMenuItem[]>();
  for (const item of menuItems) {
    const cat = item.category || "Menu";
    grouped.set(cat, [...(grouped.get(cat) ?? []), item]);
  }

  const greeting =
    restaurant.aiGreeting ??
    `Hi! Welcome to ${restaurant.name}. Browse the menu and add items to start your order. I'll help confirm everything before you pay.`;

  return (
    <>
      <OrderHeader
        restaurant={restaurant}
        cartCount={cartCount}
        menuHref={menuHref}
        onCartOpen={() => setDrawerOpen(true)}
      />

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 pb-28 sm:px-6 md:grid-cols-[1fr_360px] md:pb-5 lg:grid-cols-[1fr_380px]">
        {/* ── Left column ─────────────────────────────────── */}
        <div className="min-w-0 space-y-5">
          <OrderFulfilmentToggle
            value={fulfilmentType}
            onChange={setFulfilmentType}
            pickupEnabled={restaurant.pickupEnabled}
            deliveryEnabled={restaurant.deliveryEnabled}
          />

          <OrderChat
            messages={chat}
            greeting={greeting}
            restaurantName={restaurant.name}
            onSend={handleChat}
          />

          <OrderMenu
            grouped={grouped}
            cart={cart}
            onAdd={addToCart}
            onIncrement={increment}
            onDecrement={decrement}
          />
        </div>

        {/* ── Right column — desktop cart ──────────────────── */}
        <aside className="hidden md:block">
          <div className="sticky top-[7rem]">
            <OrderCartPanel
              cart={cart}
              customer={customer}
              fulfilmentType={fulfilmentType}
              pricing={pricing}
              checkoutPending={checkout.isPending}
              canCheckout={canCheckout}
              onIncrement={increment}
              onDecrement={decrement}
              onRemove={remove}
              onCustomerChange={updateCustomer}
              onCheckout={() => checkout.mutate()}
            />
          </div>
        </aside>
      </main>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <OrderCartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cart={cart}
        customer={customer}
        fulfilmentType={fulfilmentType}
        pricing={pricing}
        checkoutPending={checkout.isPending}
        canCheckout={canCheckout}
        onIncrement={increment}
        onDecrement={decrement}
        onCustomerChange={updateCustomer}
        onCheckout={() => checkout.mutate()}
      />

      {/* ── Mobile sticky bar ────────────────────────────────── */}
      <OrderMobileBar
        cartCount={cartCount}
        cartTotal={cartTotal}
        show={cartCount > 0 && !drawerOpen}
        onClick={() => setDrawerOpen(true)}
      />
    </>
  );
}
