"use client";

import Image from "next/image";
import { useMemo, useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  IconMinus,
  IconPlus,
  IconSend,
  IconToolsKitchen2,
  IconShoppingCart,
  IconMapPin,
  IconTrash,
  IconRobot,
  IconLoader,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { formatMoney, publicOrderingApi, type PublicMenuItem, type PublicOrderItem } from "@/lib/public-ordering";
import { getRootOrigin } from "@/lib/token";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { cn } from "@/lib/utils";

type CartLine = PublicOrderItem & { id: string };
type ChatMessage = { role: "ai" | "user"; text: string };

function toOrderItem(item: PublicMenuItem): CartLine {
  return {
    id: item._id ?? item.id ?? item.name,
    menuItemId: item._id ?? item.id,
    name: item.name,
    quantity: 1,
    unitPrice: item.basePrice,
  };
}

export default function PublicAiOrderPage() {
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug ?? "";
  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery">("pickup");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", landmark: "" });
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const menu = useQuery({
    queryKey: ["public-order-menu", tenantSlug],
    queryFn: () => publicOrderingApi.menu(tenantSlug),
    retry: false,
    enabled: Boolean(tenantSlug),
  });

  const quotePayload = useMemo(
    () => ({
      fulfilmentType,
      distanceKm: fulfilmentType === "delivery" ? 5 : 0,
      items: cart,
      customer,
    }),
    [cart, customer, fulfilmentType],
  );

  const quote = useQuery({
    queryKey: ["public-order-quote", tenantSlug, quotePayload],
    queryFn: () => publicOrderingApi.quote(tenantSlug, quotePayload),
    enabled: cart.length > 0,
    retry: false,
  });

  const checkout = useMutation({
    mutationFn: () => publicOrderingApi.checkout(tenantSlug, quotePayload),
    onSuccess: (response) => {
      const url = response.data.authorizationUrl;
      if (url) window.location.href = url;
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function addToCart(item: PublicMenuItem) {
    setCart((c) => {
      const existing = c.find((l) => l.id === (item._id ?? item.name));
      if (existing) {
        return c.map((l) => l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...c, toOrderItem(item)];
    });
    setChat((prev) => [
      ...prev,
      { role: "user", text: `Add ${item.name} to my order` },
      { role: "ai", text: `Got it! I've added ${item.name} (${formatMoney(item.basePrice)}) to your order. Want to add anything else?` },
    ]);
  }

  function sendMessage() {
    if (!message.trim()) return;
    setChat((prev) => [
      ...prev,
      { role: "user", text: message.trim() },
      { role: "ai", text: `Thanks for your message! To place your order, browse the menu and add items. I'll confirm everything before payment.` },
    ]);
    setMessage("");
  }

  const cartTotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  if (menu.isLoading) return <LogoLoadingScreen />;

  if (menu.isError || !menu.data?.tenant) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <FloatingPaths position={1} />
        </div>
        <div className="relative z-10">
          <div className="mb-4 mx-auto flex size-16 items-center justify-center rounded-2xl border bg-muted">
            <IconToolsKitchen2 className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Ordering not available</h1>
          <p className="mt-2 text-muted-foreground">This restaurant is not ready for AI ordering yet.</p>
          <Button asChild className="mt-6">
            <a href={getRootOrigin()}>Go to ChowCall</a>
          </Button>
        </div>
      </main>
    );
  }

  const restaurant = menu.data.tenant;
  const menuItems = menu.data.data;
  const pricing = quote.data?.data.pricing;

  // Group menu by category
  const grouped = new Map<string, typeof menuItems>();
  for (const item of menuItems) {
    const cat = item.category || "Menu";
    grouped.set(cat, [...(grouped.get(cat) ?? []), item]);
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href={getRootOrigin()} className="inline-flex items-center gap-2 shrink-0">
            <Image alt="ChowCall" src="/chowcall-logo.svg" width={28} height={28} />
            <span className="hidden font-semibold tracking-tight sm:block">ChowCall</span>
          </a>
          <div className="flex items-center gap-2">
            <a href={getPublicTenantPath(tenantSlug, "menu")} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              View full menu
            </a>
            {/* Mobile cart button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border bg-card transition-colors hover:bg-muted md:hidden"
            >
              <IconShoppingCart className="size-4" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Restaurant name strip */}
      <div className="border-b bg-card/50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          {restaurant.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.logo} alt={restaurant.name} className="size-9 rounded-xl border object-cover" />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-muted">
              <IconToolsKitchen2 className="size-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{restaurant.name}</p>
            {restaurant.address && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <IconMapPin className="size-3 shrink-0" />
                {restaurant.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px]">
        {/* Left: AI chat + menu */}
        <div className="space-y-5">
          {/* Fulfilment toggle */}
          <div className="flex rounded-xl border bg-muted p-1">
            {(["pickup", "delivery"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={cn(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  fulfilmentType === type
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFulfilmentType(type)}
              >
                {type === "pickup" ? "🛍 Pickup" : "🛵 Delivery"}
              </button>
            ))}
          </div>

          {/* AI Chat */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 border-b px-4 py-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                <IconRobot className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Ordering Assistant</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">● Online</p>
              </div>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {/* Initial AI greeting */}
              <div className="flex gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <IconRobot className="size-3.5 text-primary" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm">
                  {restaurant.aiGreeting ?? `Hi! Welcome to ${restaurant.name}. Browse the menu below and add items to your order. I'll help with everything!`}
                </div>
              </div>
              {chat.map((msg, i) => (
                <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "")}>
                  {msg.role === "ai" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <IconRobot className="size-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                      msg.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t p-3">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask the AI something…"
                  className="text-sm"
                />
                <Button type="submit" size="icon" className="shrink-0">
                  <IconSend className="size-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Menu */}
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <section key={category}>
                <h2 className="mb-3 text-base font-semibold">{category}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => {
                    const inCart = cart.find((l) => l.id === (item._id ?? item.name));
                    return (
                      <div
                        key={item._id ?? item.name}
                        className={cn(
                          "flex items-start gap-3 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-sm",
                          !item.available && "opacity-50"
                        )}
                      >
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.name} className="size-16 shrink-0 rounded-xl object-cover" />
                        )}
                        <div className="flex flex-1 flex-col min-w-0 gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-snug">{item.name}</p>
                            <p className="shrink-0 text-sm font-bold text-primary">{formatMoney(item.basePrice)}</p>
                          </div>
                          {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className={cn("text-xs font-medium", item.available ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                              {item.available ? "Available" : "Sold out"}
                            </span>
                            {item.available && (
                              inCart ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    className="flex size-6 items-center justify-center rounded-full border text-muted-foreground hover:text-foreground"
                                    onClick={() => setCart((c) => {
                                      const updated = c.map((l) => l.id === inCart.id ? { ...l, quantity: l.quantity - 1 } : l);
                                      return updated.filter((l) => l.quantity > 0);
                                    })}
                                  >
                                    <IconMinus className="size-3" />
                                  </button>
                                  <span className="min-w-[1.25rem] text-center text-xs font-semibold">{inCart.quantity}</span>
                                  <button
                                    type="button"
                                    className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                    onClick={() => setCart((c) => c.map((l) => l.id === inCart.id ? { ...l, quantity: l.quantity + 1 } : l))}
                                  >
                                    <IconPlus className="size-3" />
                                  </button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => addToCart(item)}>
                                  <IconPlus className="mr-1 size-3" /> Add
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Right: Order summary (desktop) */}
        <aside className="hidden md:block">
          <div className="sticky top-20 rounded-2xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <IconShoppingCart className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Your order</h2>
              {cartCount > 0 && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center px-5">
                <IconShoppingCart className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Add menu items to start your order</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  {cart.map((item, i) => (
                    <div key={`${item.id}-${i}`} className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1">
                        <button type="button" onClick={() => setCart((c) => { const u = c.map((l, j) => j === i ? { ...l, quantity: l.quantity - 1 } : l); return u.filter((l) => l.quantity > 0); })}>
                          <IconMinus className="size-3 text-muted-foreground" />
                        </button>
                        <span className="w-4 text-center font-medium text-xs">{item.quantity}</span>
                        <button type="button" onClick={() => setCart((c) => c.map((l, j) => j === i ? { ...l, quantity: l.quantity + 1 } : l))}>
                          <IconPlus className="size-3 text-muted-foreground" />
                        </button>
                      </div>
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 font-medium">{formatMoney(item.unitPrice * item.quantity)}</span>
                      <button type="button" onClick={() => setCart((c) => c.filter((_, j) => j !== i))}>
                        <IconTrash className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Customer details */}
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your details</p>
                  <Input placeholder="Name" className="h-9 text-sm" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} />
                  <Input placeholder="Phone number" className="h-9 text-sm" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} />
                  <Input placeholder="Email for receipt" className="h-9 text-sm" type="email" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} />
                  {fulfilmentType === "delivery" && (
                    <>
                      <Input placeholder="Delivery address" className="h-9 text-sm" value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} />
                      <Input placeholder="Nearest landmark" className="h-9 text-sm" value={customer.landmark} onChange={(e) => setCustomer((c) => ({ ...c, landmark: e.target.value }))} />
                    </>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-1.5 border-t pt-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatMoney(pricing?.itemSubtotal ?? cartTotal)}</span>
                  </div>
                  {fulfilmentType === "delivery" && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span>{formatMoney(pricing?.deliveryFee ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service fee</span>
                    <span>{formatMoney(pricing?.serviceFee ?? 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-bold text-base">
                    <span>Total</span>
                    <span>{formatMoney(pricing?.totalPayable ?? cartTotal)}</span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={!cart.length || !customer.name || !customer.phone || !customer.email || checkout.isPending}
                  onClick={() => checkout.mutate()}
                >
                  {checkout.isPending ? (
                    <IconLoader className="size-4 animate-spin" />
                  ) : (
                    <IconCircleCheck className="size-4" />
                  )}
                  {checkout.isPending ? "Processing…" : "Confirm & Pay"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">Powered by Paystack · Secure checkout</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Your order</h2>
              <button type="button" onClick={() => setCartOpen(false)} className="text-sm text-muted-foreground">
                Close
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No items yet — add from the menu</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex-1 truncate font-medium">{item.name}</span>
                    <span className="shrink-0 text-muted-foreground">{formatMoney(item.unitPrice)}</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" className="flex size-6 items-center justify-center rounded-full border" onClick={() => setCart((c) => { const u = c.map((l, j) => j === i ? { ...l, quantity: l.quantity - 1 } : l); return u.filter((l) => l.quantity > 0); })}>
                        <IconMinus className="size-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-semibold">{item.quantity}</span>
                      <button type="button" className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground" onClick={() => setCart((c) => c.map((l, j) => j === i ? { ...l, quantity: l.quantity + 1 } : l))}>
                        <IconPlus className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="space-y-2 border-t pt-3">
                  <Input placeholder="Name" className="h-9 text-sm" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} />
                  <Input placeholder="Phone" className="h-9 text-sm" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} />
                  <Input placeholder="Email" type="email" className="h-9 text-sm" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} />
                </div>
                <div className="flex justify-between border-t pt-3 font-bold">
                  <span>Total</span>
                  <span>{formatMoney(pricing?.totalPayable ?? cartTotal)}</span>
                </div>
                <Button
                  className="w-full gap-2"
                  disabled={!cart.length || !customer.name || !customer.phone || !customer.email || checkout.isPending}
                  onClick={() => { setCartOpen(false); checkout.mutate(); }}
                >
                  {checkout.isPending ? <IconLoader className="size-4 animate-spin" /> : <IconCircleCheck className="size-4" />}
                  {checkout.isPending ? "Processing…" : "Confirm & Pay"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile sticky cart button */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 md:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {cartCount}
            </span>
            <span className="font-semibold">View order</span>
            <span className="font-semibold">{formatMoney(cartTotal)}</span>
          </button>
        </div>
      )}
    </main>
  );
}
