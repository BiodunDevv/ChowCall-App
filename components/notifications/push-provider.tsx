"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifyPayload = {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
};

// ─── Chime helper ─────────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    const tones = [880, 1100];
    let startTime = ctx.currentTime;

    tones.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // quick attack / release envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);

      startTime += 0.22;
    });

    // close context after tones finish
    setTimeout(() => ctx.close(), 800);
  } catch {
    // audio not supported — silently ignore
  }
}

// ─── Service worker registration ─────────────────────────────────────────────

async function registerSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
    return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    // SW registration failed — app still works without it
  }
}

// ─── Request notification permission ─────────────────────────────────────────

async function requestPermission() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

// ─── Show native notification ─────────────────────────────────────────────────

function showNativeNotification({ title, body, icon, tag }: NotifyPayload) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: icon ?? "/chowcall-logo.svg",
    tag,
  });
}

// ─── PushProvider component ───────────────────────────────────────────────────

export function PushProvider() {
  useEffect(() => {
    registerSW();
    requestPermission();

    const channel = new BroadcastChannel("chowcall-notifications");

    channel.addEventListener("message", (event: MessageEvent<NotifyPayload>) => {
      const payload = event.data;
      if (!payload?.title) return;

      playChime();
      showNativeNotification(payload);

      // Always show a toast as fallback / confirmation
      toast(payload.title, {
        description: payload.body,
      });
    });

    return () => {
      channel.close();
    };
  }, []);

  return null;
}

// ─── useNotify hook ───────────────────────────────────────────────────────────

export function useNotify() {
  const notify = useCallback(
    (title: string, body: string, options?: Partial<NotifyPayload>) => {
      const channel = new BroadcastChannel("chowcall-notifications");
      channel.postMessage({ title, body, ...options });
      // close immediately after posting — listener handles the rest
      setTimeout(() => channel.close(), 100);
    },
    []
  );

  return notify;
}
