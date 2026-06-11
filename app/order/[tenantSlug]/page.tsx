"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { usePersistedCart } from "@/hooks/use-persisted-cart";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import { publicOrderingApi, type PublicMenuItem, formatMoney } from "@/lib/public-ordering";
import { isOpenNow, getNextOpeningTime } from "@/lib/opening-hours";
import { TenantBanner } from "@/components/TenantLanding/tenant-banner";
import { TenantHeader } from "@/components/TenantLanding/tenant-header";
import { AddressPicker, type AddressResult } from "@/components/ui/address-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CartLine, CustomerDetails } from "@/components/OrderFlow/order-types";
import {
  IconToolsKitchen2,
  IconPlus,
  IconMinus,
  IconTrash,
  IconShoppingCart,
  IconSend,
  IconRobot,
  IconUser,
  IconCircleCheck,
  IconLoader,
  IconShieldCheck,
  IconShoppingBag,
  IconTruck,
  IconMapPin,
  IconX,
  IconChevronUp,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMsg = { role: "ai" | "user"; text: string; itemsAdded?: string[] };
type CheckoutStep = "closed" | "details" | "confirm";

const EMPTY_CUSTOMER: CustomerDetails = {
  name: "", phone: "", email: "", address: "", landmark: "",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeId(item: PublicMenuItem) {
  return item._id ?? item.id ?? item.name;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PublicAiOrderPage() {
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug ?? "";

  // ── Cart state — persisted to localStorage, resets at midnight
  const { cart, setCart } = usePersistedCart(tenantSlug);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Menu sheet state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategory, setMenuCategory] = useState<string | null>(null);

  // ── Checkout state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("closed");
  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery">("pickup");
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [deliveryPin, setDeliveryPin] = useState<{ lat: number; lng: number } | null>(null);

  // ── Data
  const menu = useQuery({
    queryKey: ["public-order-menu", tenantSlug],
    queryFn: () => publicOrderingApi.menu(tenantSlug),
    retry: false,
    enabled: Boolean(tenantSlug),
    staleTime: 5 * 60_000,
  });

  const restaurant = menu.data?.tenant ?? null;
  const menuItems = menu.data?.data ?? [];

  // ── Photo lookup: id → url (populated once menu loads)
  const photoMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of menuItems) {
      const id = makeId(item);
      const url = item.photos?.[0]?.url ?? item.imageUrl ?? null;
      if (url) map.set(id, url);
    }
    return map;
  }, [menuItems]);

  const distanceKm = useMemo(() => {
    if (!deliveryPin) return 5;
    // Victoria Island, Lagos as restaurant default coords
    return haversineKm(6.4281, 3.4219, deliveryPin.lat, deliveryPin.lng);
  }, [deliveryPin]);

  const quotePayload = useMemo(() => ({
    fulfilmentType,
    distanceKm,
    items: cart,
    customer,
  }), [cart, customer, fulfilmentType, distanceKm]);

  const quote = useQuery({
    queryKey: ["public-order-quote", tenantSlug, quotePayload],
    queryFn: () => publicOrderingApi.quote(tenantSlug, quotePayload),
    enabled: cart.length > 0 && checkoutStep !== "closed",
    retry: false,
  });

  const checkout = useMutation({
    mutationFn: () => publicOrderingApi.checkout(tenantSlug, { ...quotePayload, customer }),
    onSuccess: (res) => {
      const url = res.data?.authorizationUrl;
      if (url) window.location.href = url;
    },
  });

  const pricing = quote.data?.data?.pricing as {
    itemSubtotal?: number; deliveryFee?: number; serviceFee?: number; totalPayable?: number;
  } | undefined;

  // ── Cart helpers
  const addToCart = useCallback((item: PublicMenuItem, flash = true) => {
    const id = makeId(item);
    setCart((prev) => {
      const ex = prev.find((l) => l.id === id);
      if (ex) return prev.map((l) => l.id === id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { id, menuItemId: item._id ?? item.id, name: item.name, quantity: 1, unitPrice: item.basePrice }];
    });
    if (flash) {
      setAddedId(id);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAddedId(null), 800);
    }
  }, []);

  const increment = useCallback((id: string) => setCart((p) => p.map((l) => l.id === id ? { ...l, quantity: l.quantity + 1 } : l)), []);
  const decrement = useCallback((id: string) => setCart((p) => p.map((l) => l.id === id ? { ...l, quantity: l.quantity - 1 } : l).filter((l) => l.quantity > 0)), []);
  const remove = useCallback((id: string) => setCart((p) => p.filter((l) => l.id !== id)), []);

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  // ── AI chat: parse message for menu item mentions
  const parseAndAddItems = useCallback((text: string): { added: string[]; reply: string } => {
    const lower = text.toLowerCase();
    const added: string[] = [];

    // Extract quantity: "2 jollof", "one chicken"
    const wordNums: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

    for (const item of menuItems) {
      if (!item.available) continue;
      const nameLower = item.name.toLowerCase();
      // Check if any word of item name appears in message
      const mainWord = nameLower.split(/[\s+]/)[0];
      if (!mainWord || !lower.includes(mainWord)) continue;

      // Try to find quantity before item name
      const before = lower.substring(0, lower.indexOf(mainWord));
      const numMatch = before.match(/(\d+)\s*$/) ?? before.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*$/i);
      let qty = 1;
      if (numMatch) {
        qty = parseInt(numMatch[1]) || wordNums[numMatch[1].toLowerCase()] || 1;
      }
      for (let i = 0; i < qty; i++) addToCart(item, i === 0);
      added.push(`${qty > 1 ? qty + "× " : ""}${item.name}`);
    }

    if (added.length > 0) {
      const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0) + added.reduce((s, name) => {
        const item = menuItems.find((m) => name.includes(m.name));
        return s + (item?.basePrice ?? 0);
      }, 0);
      return {
        added,
        reply: `Got it! I've added ${added.join(", ")} to your order. Your cart total is around ${formatMoney(total)}. Want to add anything else, or shall we go to checkout?`,
      };
    }

    // Check for checkout intent
    if (lower.match(/checkout|pay|done|confirm|that.?s all|that.?s it|complete|finish/)) {
      if (cart.length === 0) return { added: [], reply: "Your cart is empty! Let me know what you'd like to order from the menu." };
      setCheckoutStep("details");
      return { added: [], reply: `Perfect! Let's confirm your details. I've got ${cartCount} item${cartCount !== 1 ? "s" : ""} — ${formatMoney(cartTotal)} subtotal. Tap the checkout panel to fill in your name and how you'd like to receive your order.` };
    }

    // Check for menu intent
    if (lower.match(/menu|what.?s available|what do you have|options|food|eat/)) {
      setMenuOpen(true);
      return { added: [], reply: "I've opened the menu for you! Browse and tap 'Add' on any dish, or just tell me what you'd like — for example, 'I want 2 jollof rice and a puff puff'." };
    }

    // Check for cart status intent
    if (lower.match(/cart|order|what.?s in|how much|total|show/)) {
      if (cart.length === 0) return { added: [], reply: "Your cart is empty right now. Tell me what you'd like to eat or say 'show me the menu'!" };
      const items = cart.map((l) => `${l.quantity}× ${l.name}`).join(", ");
      return { added: [], reply: `You currently have: ${items}. That's ${formatMoney(cartTotal)} before fees. Want to add more or go to checkout?` };
    }

    return { added: [], reply: "I can help you place an order! Just tell me what you'd like — for example: 'I want jollof rice and a Chapman' — or browse the menu by tapping 'View Menu' below." };
  }, [menuItems, cart, cartCount, cartTotal, addToCart]);

  const sendChat = useCallback(async (text: string) => {
    if (!text.trim() || !tenantSlug) return;
    const userMsg: ChatMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setAiTyping(true);

    // Try to parse menu items from the text locally first
    const { added, reply: localReply } = parseAndAddItems(text);

    // Also call the backend chat endpoint
    try {
      const res = await publicOrderingApi.chat(tenantSlug, text, cart);
      const backendReply = res.data?.reply;
      const finalReply = added.length > 0 ? localReply : (backendReply || localReply);
      setMessages((prev) => [...prev, { role: "ai", text: finalReply, itemsAdded: added }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: localReply, itemsAdded: added }]);
    } finally {
      setAiTyping(false);
    }
  }, [tenantSlug, parseAndAddItems, cart]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  // ── Menu grouping
  const grouped = useMemo(() => {
    const groups = new Map<string, PublicMenuItem[]>();
    for (const item of menuItems) {
      const cat = item.category || "Menu";
      groups.set(cat, [...(groups.get(cat) ?? []), item]);
    }
    return Array.from(groups.entries());
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    const q = menuSearch.toLowerCase().trim();
    return menuItems.filter((item) => {
      if (menuCategory && item.category !== menuCategory) return false;
      if (q && !item.name.toLowerCase().includes(q) && !(item.description ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [menuItems, menuSearch, menuCategory]);

  const canCheckout = cart.length > 0 && Boolean(customer.name) && Boolean(customer.phone) && Boolean(customer.email) && (fulfilmentType === "pickup" || Boolean(customer.address));

  // ── Loading / error
  if (menu.isLoading) return <LogoLoadingScreen />;
  if (menu.isError || !restaurant) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-20"><FloatingPaths position={1} /></div>
        <div className="relative z-10 space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-muted">
            <IconToolsKitchen2 className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Ordering not available</h1>
          <p className="text-muted-foreground">This restaurant isn&apos;t accepting orders yet.</p>
          <Button asChild className="rounded-full"><a href={getRootOrigin()}>Go to ChowCall</a></Button>
        </div>
      </main>
    );
  }

  const menuHref = getPublicTenantPath(tenantSlug, "menu");
  const orderHref = getPublicTenantPath(tenantSlug, "order");
  const callHref = restaurant.phone ? `tel:${restaurant.phone}` : menuHref;
  const open = isOpenNow(restaurant.openingHours);
  const nextOpen = getNextOpeningTime(restaurant.openingHours);
  const greeting = restaurant.aiGreeting ?? `Hi! Welcome to ${restaurant.name}. Tell me what you'd like to order — or say "show me the menu" to browse. I'll add it to your cart!`;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">

      {/* Banner */}
      <TenantBanner
        text={restaurant.bannerText}
        enabled={restaurant.bannerEnabled ?? false}
        restaurantName={restaurant.name}
        restaurantLogo={restaurant.logo}
        open={open}
        nextOpen={nextOpen}
        orderHref={orderHref}
        callHref={callHref}
        phone={restaurant.phone ?? null}
      />

      {/* Header */}
      <TenantHeader
        restaurantName={restaurant.name}
        restaurantLogo={restaurant.logo}
        phone={restaurant.phone ?? null}
        orderHref={orderHref}
        menuHref={menuHref}
        cartCount={cartCount}
        onCartOpen={() => setCheckoutStep("details")}
      />

      {/* Main: chat + cart side by side — fills remaining height */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── LEFT: AI Chat panel ─────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Chat messages — THIS is the scroll container */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 sm:px-6">

            {/* AI greeting */}
            <AiBubble text={greeting} />

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-2 pl-8">
              {[
                "Show me the menu",
                "What's popular?",
                "What's in my cart?",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => sendChat(chip)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message history */}
            {messages.map((msg, i) =>
              msg.role === "ai" ? (
                <div key={i}>
                  <AiBubble text={msg.text} />
                  {msg.itemsAdded && msg.itemsAdded.length > 0 && (
                    <div className="mt-2 pl-8 flex flex-wrap gap-1.5">
                      {msg.itemsAdded.map((name) => (
                        <span key={name} className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300">
                          <IconCircleCheck className="size-3" />{name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <UserBubble key={i} text={msg.text} />
              )
            )}

            {aiTyping && (
              <div className="flex items-end gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <IconRobot className="size-3.5 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat input bar */}
          <div className="border-t bg-card/80 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <IconSparkles className="size-3.5 text-primary" />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-full border bg-background px-3 py-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(inputText); } }}
                  placeholder="What would you like to order?"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => sendChat(inputText)}
                  disabled={!inputText.trim() || aiTyping}
                  className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
                >
                  <IconSend className="size-3.5" />
                </button>
              </div>
              {/* View menu button */}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted shrink-0"
              >
                <IconToolsKitchen2 className="size-3.5" />
                <span className="hidden sm:block">Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Live cart sidebar (desktop only) ─────────── */}
        <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-l bg-card">
          <CartSidebar
            cart={cart}
            cartCount={cartCount}
            cartTotal={cartTotal}
            photoMap={photoMap}
            onIncrement={increment}
            onDecrement={decrement}
            onRemove={remove}
            onCheckout={() => setCheckoutStep("details")}
            onBrowseMenu={() => setMenuOpen(true)}
          />
        </aside>
      </div>

      {/* ── Mobile cart FAB ─────────────────────────────────────── */}
      {cartCount > 0 && checkoutStep === "closed" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <button
            type="button"
            onClick={() => setCheckoutStep("details")}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-2xl transition-all active:scale-[0.98] hover:opacity-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">{cartCount}</span>
              <IconShoppingCart className="size-5" />
              <span className="font-semibold">View Cart</span>
            </div>
            <span className="font-bold text-lg">{formatMoney(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* ── Menu sheet ──────────────────────────────────────────── */}
      {menuOpen && (
        <MenuSheet
          items={menuItems}
          filteredItems={filteredItems}
          grouped={grouped}
          search={menuSearch}
          onSearchChange={setMenuSearch}
          activeCategory={menuCategory}
          onCategoryChange={setMenuCategory}
          cart={cart}
          addedId={addedId}
          onAdd={addToCart}
          onIncrement={increment}
          onDecrement={decrement}
          onClose={() => setMenuOpen(false)}
          makeId={makeId}
        />
      )}

      {/* ── Checkout sheet ──────────────────────────────────────── */}
      {checkoutStep !== "closed" && (
        <CheckoutSheet
          step={checkoutStep}
          cart={cart}
          cartTotal={cartTotal}
          photoMap={photoMap}
          pricing={pricing}
          customer={customer}
          fulfilmentType={fulfilmentType}
          deliveryPin={deliveryPin}
          distanceKm={distanceKm}
          canCheckout={canCheckout}
          checkoutPending={checkout.isPending}
          restaurant={restaurant}
          onStep={setCheckoutStep}
          onFulfilment={setFulfilmentType}
          onCustomer={(field, val) => setCustomer((p) => ({ ...p, [field]: val }))}
          onDeliveryPin={setDeliveryPin}
          onDeliveryAddress={(addr) => setCustomer((p) => ({ ...p, address: addr }))}
          onCheckout={() => checkout.mutate()}
          onClose={() => setCheckoutStep("closed")}
          onIncrement={increment}
          onDecrement={decrement}
          onRemove={remove}
        />
      )}
    </div>
  );
}

// ─── Chat bubbles ──────────────────────────────────────────────────────────────

function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <IconRobot className="size-3.5 text-primary" />
        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-card bg-emerald-500" />
      </div>
      <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
        {text}
      </div>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <IconUser className="size-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

// ─── Cart Sidebar (desktop) ────────────────────────────────────────────────────

function CartSidebar({ cart, cartCount, cartTotal, photoMap, onIncrement, onDecrement, onRemove, onCheckout, onBrowseMenu }: {
  cart: CartLine[];
  cartCount: number;
  cartTotal: number;
  photoMap: Map<string, string>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onBrowseMenu: () => void;
}) {
  return (
    // h-full + flex-col so it never grows beyond the panel height
    <div className="flex h-full flex-col overflow-hidden">

      {/* Header — fixed */}
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <IconShoppingCart className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Your Order</h2>
        </div>
        {cartCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            {cartCount} {cartCount === 1 ? "plate" : "plates"}
          </span>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted/50">
            <IconShoppingCart className="size-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium">Your order is empty</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Chat with the AI or browse the menu to add dishes
            </p>
          </div>
          <Button onClick={onBrowseMenu} variant="outline" size="sm" className="rounded-full gap-1.5">
            <IconToolsKitchen2 className="size-3.5" />Browse Menu
          </Button>
        </div>
      ) : (
        <>
          {/* Plate cards — scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {cart.map((line) => (
              <PlateCard
                key={line.id}
                line={line}
                photo={photoMap.get(line.id) ?? null}
                onIncrement={() => onIncrement(line.id)}
                onDecrement={() => onDecrement(line.id)}
                onRemove={() => onRemove(line.id)}
              />
            ))}
          </div>

          {/* Footer — fixed */}
          <div className="shrink-0 border-t bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">{formatMoney(cartTotal)}</span>
            </div>
            <Button onClick={onCheckout} className="w-full rounded-full gap-1.5" size="lg">
              <IconShoppingCart className="size-4" />
              Checkout · {formatMoney(cartTotal)}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Delivery fee & service fee calculated at checkout
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Plate Card ────────────────────────────────────────────────────────────────

function PlateCard({ line, photo, onIncrement, onDecrement, onRemove }: {
  line: CartLine;
  photo?: string | null;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-sm">
      {/* Food photo / fallback accent */}
      <div className="absolute left-3 top-3 size-9 shrink-0 overflow-hidden rounded-xl">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={line.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-primary/10 text-base select-none">
            <IconToolsKitchen2 className="size-4 text-primary/60" />
          </div>
        )}
      </div>

      <div className="px-4 pb-3 pt-3 pl-14">
        {/* Name + price row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">{line.name}</p>
          <p className="shrink-0 text-sm font-bold text-primary">
            {formatMoney(line.unitPrice * line.quantity)}
          </p>
        </div>

        {/* Per-unit price */}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatMoney(line.unitPrice)} × {line.quantity}
        </p>

        {/* Controls */}
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border bg-background px-1.5 py-1">
            <button
              type="button"
              onClick={onDecrement}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconMinus className="size-3" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold">{line.quantity}</span>
            <button
              type="button"
              onClick={onIncrement}
              className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <IconPlus className="size-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground/30 transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove"
          >
            <IconTrash className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Menu Sheet ────────────────────────────────────────────────────────────────

function MenuSheet({ items, filteredItems, grouped, search, onSearchChange, activeCategory, onCategoryChange, cart, addedId, onAdd, onIncrement, onDecrement, onClose, makeId }: {
  items: PublicMenuItem[];
  filteredItems: PublicMenuItem[];
  grouped: [string, PublicMenuItem[]][];
  search: string;
  onSearchChange: (v: string) => void;
  activeCategory: string | null;
  onCategoryChange: (v: string | null) => void;
  cart: CartLine[];
  addedId: string | null;
  onAdd: (item: PublicMenuItem) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onClose: () => void;
  makeId: (item: PublicMenuItem) => string;
}) {
  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const categories = grouped.map(([cat]) => cat);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto flex max-h-[92dvh] flex-col rounded-t-3xl bg-background md:m-auto md:max-h-[85dvh] md:w-[640px] md:rounded-2xl md:shadow-2xl">

        {/* Handle */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold">Browse Menu</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{items.filter((i) => i.available).length} available</span>
            <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
              <IconX className="size-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dishes…"
              className="h-9 w-full rounded-full border bg-muted/50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-5 py-2.5 border-b [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={["shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all", !activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:text-foreground"].join(" ")}
            >All</button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat === activeCategory ? null : cat)}
                className={["shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all", activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:text-foreground"].join(" ")}
              >{cat}</button>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filteredItems.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No dishes match your search</p>
          )}
          {filteredItems.map((item) => {
            const photo = item.photos?.[0]?.url ?? item.imageUrl ?? null;
            const id = makeId(item);
            const line = cart.find((l) => l.id === id);
            const justAdded = addedId === id;
            return (
              <div
                key={id}
                className={["relative flex gap-3 rounded-2xl border bg-card p-3 transition-all", !item.available ? "opacity-50" : "hover:shadow-sm", line ? "border-primary/30 ring-1 ring-primary/10" : ""].join(" ")}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={item.name} className="size-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <IconToolsKitchen2 className="size-6 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-semibold leading-snug">{item.name}</p>
                    <p className="shrink-0 text-sm font-bold text-primary">{formatMoney(item.basePrice)}</p>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className={["text-xs font-medium", item.available ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"].join(" ")}>
                      {item.available ? "Available" : "Sold out"}
                    </span>
                    {item.available && (
                      line ? (
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => onDecrement(line.id)} className="flex size-7 items-center justify-center rounded-full border bg-background hover:bg-muted">
                            <IconMinus className="size-3" />
                          </button>
                          <span className="min-w-[1.25rem] text-center text-sm font-bold">{line.quantity}</span>
                          <button type="button" onClick={() => onAdd(item)} className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90">
                            <IconPlus className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAdd(item)}
                          className={["flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200", justAdded ? "scale-95 bg-primary text-primary-foreground border-primary" : "hover:bg-primary hover:text-primary-foreground hover:border-primary"].join(" ")}
                        >
                          <IconPlus className="size-3" />Add
                        </button>
                      )
                    )}
                  </div>
                </div>
                {justAdded && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/10 animate-in fade-in-0 zoom-in-95 duration-300">
                    <IconCircleCheck className="size-8 text-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom: close + cart count */}
        <div className="border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85"
          >
            <IconChevronUp className="size-4" />
            Done browsing
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Sheet ────────────────────────────────────────────────────────────

function CheckoutSheet({ step, cart, cartTotal, photoMap, pricing, customer, fulfilmentType, deliveryPin, distanceKm, canCheckout, checkoutPending, restaurant, onStep, onFulfilment, onCustomer, onDeliveryPin, onDeliveryAddress, onCheckout, onClose, onIncrement, onDecrement, onRemove }: {
  step: CheckoutStep;
  cart: CartLine[];
  cartTotal: number;
  photoMap: Map<string, string>;
  pricing: { itemSubtotal?: number; deliveryFee?: number; serviceFee?: number; totalPayable?: number } | undefined;
  customer: CustomerDetails;
  fulfilmentType: "pickup" | "delivery";
  deliveryPin: { lat: number; lng: number } | null;
  distanceKm: number;
  canCheckout: boolean;
  checkoutPending: boolean;
  restaurant: { pickupEnabled?: boolean | null; deliveryEnabled?: boolean | null };
  onStep: (s: CheckoutStep) => void;
  onFulfilment: (v: "pickup" | "delivery") => void;
  onCustomer: (field: keyof CustomerDetails, value: string) => void;
  onDeliveryPin: (pin: { lat: number; lng: number } | null) => void;
  onDeliveryAddress: (addr: string) => void;
  onCheckout: () => void;
  onClose: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const total = pricing?.totalPayable ?? cartTotal;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto flex max-h-[95dvh] w-full flex-col rounded-t-3xl bg-background md:m-auto md:max-h-[85dvh] md:max-w-lg md:rounded-2xl md:shadow-2xl">

        {/* Handle */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-3">
            {step === "confirm" && (
              <button type="button" onClick={() => onStep("details")} className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
                <IconX className="size-3.5 rotate-45" style={{ transform: "rotate(225deg)" }} />
              </button>
            )}
            <h2 className="font-semibold">{step === "details" ? "Your Details" : "Confirm Order"}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
            <IconX className="size-4" />
          </button>
        </div>

        {/* ── Details step */}
        {step === "details" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Plate-based cart summary */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Your plates ({cart.reduce((s, l) => s + l.quantity, 0)})
              </p>
              {cart.map((line) => (
                <PlateCard
                  key={line.id}
                  line={line}
                  photo={photoMap.get(line.id) ?? null}
                  onIncrement={() => onIncrement(line.id)}
                  onDecrement={() => onDecrement(line.id)}
                  onRemove={() => onRemove(line.id)}
                />
              ))}
              <div className="flex justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{formatMoney(cartTotal)}</span>
              </div>
            </div>

            {/* Fulfilment */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How would you like your order?</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "pickup" as const, label: "Pickup", sub: "Collect in-store", icon: IconShoppingBag, disabled: restaurant.pickupEnabled === false },
                  { key: "delivery" as const, label: "Delivery", sub: "Delivered to you", icon: IconTruck, disabled: restaurant.deliveryEnabled === false },
                ].map(({ key, label, sub, icon: Icon, disabled }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => onFulfilment(key)}
                    className={["flex flex-col items-center gap-1.5 rounded-xl border-2 p-3.5 text-center transition-all",
                      fulfilmentType === key ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-foreground/20",
                      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                  >
                    <Icon className={["size-5", fulfilmentType === key ? "text-primary" : "text-muted-foreground"].join(" ")} />
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                    {fulfilmentType === key && <IconCircleCheck className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your details</p>
              <CheckoutField label="Full name" placeholder="Your name" value={customer.name} onChange={(v) => onCustomer("name", v)} />
              <CheckoutField label="Phone" placeholder="+234 800 000 0000" value={customer.phone} onChange={(v) => onCustomer("phone", v)} type="tel" />
              <CheckoutField label="Email" placeholder="you@example.com" value={customer.email} onChange={(v) => onCustomer("email", v)} type="email" />
            </div>

            {/* Delivery address */}
            {fulfilmentType === "delivery" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Delivery address</p>
                <AddressPicker
                  value={customer.address}
                  placeholder="Search your delivery address…"
                  onChange={(result: AddressResult | null) => {
                    onDeliveryAddress(result?.address ?? "");
                    onDeliveryPin(result ? { lat: result.lat, lng: result.lng } : null);
                  }}
                />
                {deliveryPin && (
                  <div className="flex items-center gap-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 px-3 py-2.5">
                    <IconMapPin className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-teal-700 dark:text-teal-300 truncate">{customer.address}</p>
                      <p className="text-[11px] text-teal-600/70 dark:text-teal-400/60">{distanceKm.toFixed(1)} km from restaurant</p>
                    </div>
                  </div>
                )}
                <CheckoutField label="Landmark (optional)" placeholder="Nearest bus stop" value={customer.landmark} onChange={(v) => onCustomer("landmark", v)} />
              </div>
            )}
          </div>
        )}

        {/* ── Confirm step */}
        {step === "confirm" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-muted/20">
              <div className="divide-y">
                {cart.map((line) => (
                  <div key={line.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="flex-1 truncate">{line.quantity}× {line.name}</span>
                    <span className="font-semibold shrink-0">{formatMoney(line.unitPrice * line.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{formatMoney(pricing?.itemSubtotal ?? cartTotal)}</span>
                </div>
                {fulfilmentType === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span><span>{pricing?.deliveryFee != null ? formatMoney(pricing.deliveryFee) : "Calculating…"}</span>
                  </div>
                )}
                {(pricing?.serviceFee ?? 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service fee</span><span>{formatMoney(pricing!.serviceFee!)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 px-4 py-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                {fulfilmentType === "delivery" ? <IconTruck className="size-4 shrink-0" /> : <IconShoppingBag className="size-4 shrink-0" />}
                <span className="font-medium text-foreground capitalize">{fulfilmentType}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconUser className="size-4 shrink-0" />
                <span>{customer.name} · {customer.phone}</span>
              </div>
              {fulfilmentType === "delivery" && customer.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <IconMapPin className="size-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{customer.address}{customer.landmark ? ` · ${customer.landmark}` : ""}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="border-t p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-2.5">
          {step === "details" ? (
            <Button
              className="w-full rounded-full h-12 text-base gap-2"
              disabled={!canCheckout}
              onClick={() => onStep("confirm")}
            >
              Review Order <IconCircleCheck className="size-4" />
            </Button>
          ) : (
            <Button
              className="w-full rounded-full h-12 text-base gap-2"
              disabled={!canCheckout || checkoutPending}
              onClick={onCheckout}
            >
              {checkoutPending ? (
                <><IconLoader className="size-5 animate-spin" />Processing…</>
              ) : (
                <><IconCircleCheck className="size-5" />Pay {formatMoney(total)}</>
              )}
            </Button>
          )}
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <IconShieldCheck className="size-3.5" />Secured by Paystack · Flutterwave
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutField({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 text-sm" />
    </div>
  );
}
