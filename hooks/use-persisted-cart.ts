"use client";

import { useState, useEffect, useCallback } from "react";
import type { CartLine } from "@/components/OrderFlow/order-types";

type PersistedCart = {
  date: string; // "YYYY-MM-DD"
  items: CartLine[];
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadCart(key: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedCart;
    // Reset if saved on a different calendar day
    if (parsed.date !== todayStr()) return [];
    return parsed.items ?? [];
  } catch {
    return [];
  }
}

function saveCart(key: string, items: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedCart = { date: todayStr(), items };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function usePersistedCart(tenantSlug: string) {
  const storageKey = `chowcall_cart_${tenantSlug}`;

  const [cart, setCartRaw] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setCartRaw(loadCart(storageKey));
    setHydrated(true);
  }, [storageKey]);

  // Persist whenever cart changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveCart(storageKey, cart);
  }, [cart, storageKey, hydrated]);

  // Schedule midnight reset
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };

    const id = setTimeout(() => {
      setCartRaw([]);
    }, msUntilMidnight());

    return () => clearTimeout(id);
  }, []);

  const setCart = useCallback((updater: CartLine[] | ((prev: CartLine[]) => CartLine[])) => {
    setCartRaw(updater);
  }, []);

  return { cart, setCart, hydrated };
}
