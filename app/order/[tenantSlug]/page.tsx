"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { usePersistedCart } from "@/hooks/use-persisted-cart";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getRootOrigin } from "@/lib/token";
import {
  publicOrderingApi,
  type PublicMenuItem,
  type PublicOrderItem,
  type PublicOrderSession,
  formatMoney,
} from "@/lib/public-ordering";
import { isOpenNow, getNextOpeningTime } from "@/lib/opening-hours";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
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
  IconMicrophone,
  IconMicrophoneOff,
  IconVolume,
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
  IconMail,
  IconArrowRight,
  IconAlertTriangle,
  IconPhone,
  IconMenu2,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TranscriptMsg = { role: "ai" | "user"; text: string; itemsAdded?: string[] };
type CheckoutStep = "closed" | "details" | "confirm";
type VoiceCallState = "idle" | "connecting" | "speaking" | "listening" | "thinking" | "error";
type SpeechSdkModule = typeof import("microsoft-cognitiveservices-speech-sdk");
type SpeechRecognizer = InstanceType<SpeechSdkModule["SpeechRecognizer"]>;
type SpeechSynthesizer = InstanceType<SpeechSdkModule["SpeechSynthesizer"]>;

const EMPTY_CUSTOMER: CustomerDetails = {
  name: "", phone: "", email: "", address: "", landmark: "",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeId(item: PublicMenuItem) {
  return item._id ?? item.id ?? item.name;
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PublicAiOrderPage() {
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug ?? "";

  // ── Cart state — persisted to localStorage, resets at midnight
  const { cart, setCart } = usePersistedCart(tenantSlug);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Voice order state
  const [messages, setMessages] = useState<TranscriptMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [statusToken, setStatusToken] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceCallState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSynthesizer | null>(null);
  const speechSdkRef = useRef<SpeechSdkModule | null>(null);
  const speechConfigRef = useRef<ReturnType<
    SpeechSdkModule["SpeechConfig"]["fromAuthorizationToken"]
  > | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  // ── Menu sheet state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategory, setMenuCategory] = useState<string | null>(null);

  // ── Checkout state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("closed");
  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery">("pickup");
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [capturedEmail, setCapturedEmail] = useState<string>("");
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
  const voiceUnavailable =
    restaurant?.active === false || restaurant?.voice?.enabled === false;
  const voiceUnavailableMessage =
    restaurant?.active === false
      ? "AI voice ordering is available after this restaurant activates ChowCall."
      : "AI voice ordering is not active for this restaurant right now.";

  // ── Photo lookup: id → url
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
    return haversineKm(6.4281, 3.4219, deliveryPin.lat, deliveryPin.lng);
  }, [deliveryPin]);

  const quotePayload = useMemo(
    () => ({ fulfilmentType, distanceKm, items: cart, customer }),
    [cart, customer, fulfilmentType, distanceKm],
  );

  const quote = useQuery({
    queryKey: ["public-order-quote", tenantSlug, quotePayload],
    queryFn: () => publicOrderingApi.quote(tenantSlug, quotePayload),
    enabled: cart.length > 0 && checkoutStep !== "closed",
    retry: false,
  });

  const checkout = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        return publicOrderingApi.checkout(tenantSlug, { ...quotePayload, customer });
      }
      const created = await publicOrderingApi.createOrder(tenantSlug, {
        sessionId,
        customer,
        fulfilmentType,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId ?? item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
      });
      const orderId = created.data?.order?.id ?? created.data?.order?._id;
      const token = created.data?.statusToken ?? null;
      if (token) setStatusToken(token);
      if (!orderId) return created;
      return publicOrderingApi.createPaymentLink(tenantSlug, orderId, {
        token: token ?? statusToken ?? undefined,
      });
    },
    onSuccess: (res) => {
      const url = res.data?.authorizationUrl;
      if (url) window.location.href = url;
    },
  });

  const pricing = quote.data?.data?.pricing as
    | { itemSubtotal?: number; deliveryFee?: number; serviceFee?: number; totalPayable?: number }
    | undefined;

  const syncDraftSession = useCallback(
    (session?: PublicOrderSession | null) => {
      if (!session) return;
      setSessionId(session.id);
      if (session.fulfilmentType === "pickup" || session.fulfilmentType === "delivery") {
        setFulfilmentType(session.fulfilmentType);
      }
      if (session.customer) {
        setCustomer((prev) => ({
          ...prev,
          name:
            typeof session.customer?.name === "string" ? session.customer.name : prev.name,
          phone:
            typeof session.customer?.phone === "string" ? session.customer.phone : prev.phone,
          email:
            typeof session.customer?.email === "string" ? session.customer.email : prev.email,
          address:
            typeof session.customer?.address === "string"
              ? session.customer.address
              : prev.address,
          landmark:
            typeof session.customer?.landmark === "string"
              ? session.customer.landmark
              : prev.landmark,
        }));
      }
      if (Array.isArray(session.items)) {
        setCart(
          session.items.map((item: PublicOrderItem) => {
            const id = item.menuItemId ?? item.name;
            return {
              ...item,
              id,
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: Number(item.quantity ?? 1),
              unitPrice: Number(item.unitPrice ?? 0),
            };
          }),
        );
      }
    },
    [setCart],
  );

  // ── Cart helpers
  const addToCart = useCallback((item: PublicMenuItem, flash = true) => {
    const id = makeId(item);
    setCart((prev) => {
      const ex = prev.find((l) => l.id === id);
      if (ex) return prev.map((l) => (l.id === id ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...prev,
        {
          id,
          menuItemId: item._id ?? item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.basePrice,
        },
      ];
    });
    if (flash) {
      setAddedId(id);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAddedId(null), 800);
    }
  }, []);

  const increment = useCallback(
    (id: string) =>
      setCart((p) => p.map((l) => (l.id === id ? { ...l, quantity: l.quantity + 1 } : l))),
    [],
  );
  const decrement = useCallback(
    (id: string) =>
      setCart((p) =>
        p.map((l) => (l.id === id ? { ...l, quantity: l.quantity - 1 } : l)).filter(
          (l) => l.quantity > 0,
        ),
      ),
    [],
  );
  const remove = useCallback(
    (id: string) => setCart((p) => p.filter((l) => l.id !== id)),
    [],
  );

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  // ── Start isolated ordering session on load
  useEffect(() => {
    if (!tenantSlug || !restaurant || sessionId) return;
    let mounted = true;
    publicOrderingApi
      .startChatSession(tenantSlug)
      .then((res) => {
        if (!mounted) return;
        syncDraftSession(res.data.session);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [restaurant, sessionId, syncDraftSession, tenantSlug]);

  // ── Fast SSML speech synthesis (+15% rate for snappier responses)
  const speakText = useCallback(
    (text: string) =>
      new Promise<void>((resolve, reject) => {
        const SpeechSDK = speechSdkRef.current;
        const speechConfig = speechConfigRef.current;
        if (!SpeechSDK || !speechConfig || !text.trim()) {
          resolve();
          return;
        }
        const synthesizer = new SpeechSDK.SpeechSynthesizer(
          speechConfig,
          SpeechSDK.AudioConfig.fromDefaultSpeakerOutput(),
        );
        synthesizerRef.current = synthesizer;
        const voiceName = speechConfig.speechSynthesisVoiceName || "en-NG-EzinneNeural";
        const lang = speechConfig.speechRecognitionLanguage || "en-NG";
        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voiceName}"><prosody rate="15%">${escapeXml(text)}</prosody></voice></speak>`;
        synthesizer.speakSsmlAsync(
          ssml,
          () => {
            synthesizer.close();
            if (synthesizerRef.current === synthesizer) synthesizerRef.current = null;
            resolve();
          },
          (error) => {
            synthesizer.close();
            if (synthesizerRef.current === synthesizer) synthesizerRef.current = null;
            reject(new Error(String(error || "Speech playback failed.")));
          },
        );
      }),
    [],
  );

  const stopVoiceCall = useCallback(() => {
    const recognizer = recognizerRef.current;
    const synthesizer = synthesizerRef.current;
    recognizerRef.current = null;
    synthesizerRef.current = null;
    setLiveTranscript("");
    if (synthesizer) synthesizer.close();
    if (!recognizer) {
      setVoiceState("idle");
      return;
    }
    recognizer.stopContinuousRecognitionAsync(
      () => {
        recognizer.close();
        setVoiceState("idle");
      },
      () => {
        recognizer.close();
        setVoiceState("idle");
      },
    );
  }, []);

  const startRecognizer = useCallback((recognizer: SpeechRecognizer) => {
    recognizer.startContinuousRecognitionAsync(
      () => setVoiceState("listening"),
      (error) => {
        recognizer.close();
        recognizerRef.current = null;
        setVoiceError(String(error || "Voice ordering is temporarily unavailable."));
        setVoiceState("error");
      },
    );
  }, []);

  const startVoiceCall = useCallback(async () => {
    if (voiceUnavailable) {
      setVoiceState("error");
      setVoiceError(voiceUnavailableMessage);
      return;
    }
    if (
      voiceState === "connecting" ||
      voiceState === "speaking" ||
      voiceState === "listening" ||
      voiceState === "thinking"
    )
      return;
    setVoiceError(null);
    setLiveTranscript("");
    setVoiceState("connecting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Voice ordering is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const [{ data }, SpeechSDK] = await Promise.all([
        publicOrderingApi.webSpeechToken(tenantSlug),
        import("microsoft-cognitiveservices-speech-sdk"),
      ]);

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
        data.token,
        data.region,
      );
      speechConfig.speechRecognitionLanguage = data.voice.speechLanguage || "en-NG";
      speechConfig.speechSynthesisVoiceName =
        data.voice.speechVoiceName || "en-NG-EzinneNeural";
      // Reduce initial silence timeout for faster response
      speechConfig.setProperty(
        "SpeechServiceConnection_InitialSilenceTimeoutMs",
        "4000",
      );
      speechConfig.setProperty(
        "SpeechServiceConnection_EndSilenceTimeoutMs",
        "700",
      );
      speechSdkRef.current = SpeechSDK;
      speechConfigRef.current = speechConfig;

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;

      recognizer.recognizing = (_sender, event) => {
        setLiveTranscript(event.result.text);
      };

      recognizer.recognized = async (_sender, event) => {
        const text = event.result.text?.trim();
        setLiveTranscript("");
        if (!text) return;
        setVoiceState("thinking");
        recognizer.stopContinuousRecognitionAsync(
          async () => {
            try {
              const res = await publicOrderingApi.sendChatMessage(tenantSlug, {
                sessionId,
                message: text,
              });
              syncDraftSession(res.data.session);
              const added = (res.data.addedItems ?? []).map(
                (item) =>
                  `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.name}`,
              );
              const finalReply =
                res.data.assistantMessage ||
                res.data.reply ||
                "I updated your order.";
              if (res.data.paymentReady) setCheckoutStep("details");
              setMessages((prev) => [
                ...prev,
                { role: "user", text },
                { role: "ai", text: finalReply, itemsAdded: added },
              ]);
              setVoiceState("speaking");
              await speakText(finalReply);
            } catch {
              const fallback = "I could not update that order. Please try again.";
              setMessages((prev) => [
                ...prev,
                { role: "user", text },
                { role: "ai", text: fallback },
              ]);
              setVoiceError(fallback);
            } finally {
              if (recognizerRef.current === recognizer) startRecognizer(recognizer);
            }
          },
          () => {
            if (recognizerRef.current === recognizer) startRecognizer(recognizer);
          },
        );
      };

      recognizer.canceled = (_sender, event) => {
        setVoiceError(event.errorDetails || "Voice ordering is temporarily unavailable.");
        recognizerRef.current = null;
        recognizer.close();
        setVoiceState("error");
      };

      recognizer.sessionStopped = () => {
        if (recognizerRef.current === recognizer) {
          recognizerRef.current = null;
          recognizer.close();
          setVoiceState("idle");
        }
      };

      setVoiceState("speaking");
      await speakText(data.voice.greeting);
      if (recognizerRef.current === recognizer) startRecognizer(recognizer);
    } catch (error) {
      setVoiceError(
        error instanceof Error
          ? error.message
          : "Voice ordering is temporarily unavailable.",
      );
      setVoiceState("error");
    }
  }, [
    sessionId,
    speakText,
    startRecognizer,
    syncDraftSession,
    tenantSlug,
    voiceState,
    voiceUnavailable,
    voiceUnavailableMessage,
  ]);

  useEffect(() => stopVoiceCall, [stopVoiceCall]);

  // Auto-scroll to bottom on new messages/transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript, voiceState]);

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
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !(item.description ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [menuItems, menuSearch, menuCategory]);

  // Sync capturedEmail into customer
  useEffect(() => {
    if (capturedEmail) {
      setCustomer((prev) => ({ ...prev, email: capturedEmail }));
    }
  }, [capturedEmail]);

  // Detect if the AI is asking for email
  const lastAiMessage = [...messages].reverse().find((m) => m.role === "ai");
  const needsEmailCapture =
    !capturedEmail &&
    !customer.email &&
    lastAiMessage !== undefined &&
    lastAiMessage.text.toLowerCase().includes("email");

  const canCheckout =
    cart.length > 0 &&
    Boolean(customer.name) &&
    Boolean(customer.phone) &&
    Boolean(customer.email) &&
    (fulfilmentType === "pickup" || Boolean(customer.address));

  // ── Loading / error
  if (menu.isLoading) return <LogoLoadingScreen />;
  if (menu.isError || !restaurant) {
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
          <p className="text-muted-foreground">
            This restaurant isn&apos;t accepting orders yet.
          </p>
          <Button asChild className="rounded-full">
            <a href={getRootOrigin()}>Go to ChowCall</a>
          </Button>
        </div>
      </main>
    );
  }

  const open = isOpenNow(restaurant.openingHours);
  const nextOpen = getNextOpeningTime(restaurant.openingHours);
  const greeting =
    restaurant.aiGreeting ??
    `Hi! Welcome to ${restaurant.name}. Tap the mic and tell me what you'd like to order — or ask to see the menu.`;

  const voiceActive =
    voiceState === "connecting" ||
    voiceState === "speaking" ||
    voiceState === "listening" ||
    voiceState === "thinking";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">

      {/* Announcement banner */}
      {restaurant.bannerEnabled && restaurant.bannerText && (
        <div className="flex shrink-0 items-center justify-center gap-2 border-b bg-primary/10 px-4 py-1.5 text-center text-xs font-medium text-primary dark:bg-primary/15">
          <span>{restaurant.bannerText}</span>
        </div>
      )}

      {/* Order page header */}
      <OrderHeader
        restaurantName={restaurant.name}
        restaurantLogo={restaurant.logo ?? null}
        open={open}
        nextOpen={nextOpen}
        phone={restaurant.phone ?? null}
        cartCount={cartCount}
        onMenu={() => setMenuOpen(true)}
        onCart={() => setCheckoutStep("details")}
      />

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── CENTER: Voice panel ──────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* ── Scrollable transcript area ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-lg px-4 py-5">

              {/* Restaurant hero — shown when no messages yet */}
              {messages.length === 0 && (
                <RestaurantHero
                  restaurant={restaurant}
                  greeting={greeting}
                  open={open}
                  nextOpen={nextOpen}
                  voiceUnavailable={voiceUnavailable}
                  voiceUnavailableMessage={voiceUnavailableMessage}
                />
              )}

              {/* Read-only transcript */}
              {messages.length > 0 && (
                <div className="space-y-4">
                  {/* Re-show greeting as first AI bubble */}
                  <AiBubble text={greeting} />

                  {messages.map((msg, i) =>
                    msg.role === "ai" ? (
                      <div key={i}>
                        <AiBubble text={msg.text} />
                        {msg.itemsAdded && msg.itemsAdded.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                            {msg.itemsAdded.map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300"
                              >
                                <IconCircleCheck className="size-3" />
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <UserBubble key={i} text={msg.text} />
                    ),
                  )}

                  {/* Email capture card */}
                  {needsEmailCapture && (
                    <EmailCaptureCard
                      onSubmit={(email) => {
                        setCapturedEmail(email);
                        publicOrderingApi
                          .sendChatMessage(tenantSlug, { sessionId, message: email })
                          .then((res) => {
                            syncDraftSession(res.data.session);
                            const reply =
                              res.data.assistantMessage ||
                              res.data.reply ||
                              "Got it! Your order is ready.";
                            if (res.data.paymentReady) setCheckoutStep("details");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: email },
                              { role: "ai", text: reply },
                            ]);
                          })
                          .catch(() => undefined);
                      }}
                    />
                  )}
                </div>
              )}

              <div ref={transcriptBottomRef} />
            </div>
          </div>

          {/* ── Voice control bottom section ── */}
          <div className="shrink-0 border-t bg-card/80 backdrop-blur-sm">
            <div className="mx-auto w-full max-w-lg px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">

              {/* Live transcript chip */}
              <TranscriptChip state={voiceState} transcript={liveTranscript} error={voiceError} />

              {/* Large mic button */}
              <MicButton
                state={voiceState}
                onStart={startVoiceCall}
                onStop={stopVoiceCall}
                disabled={voiceUnavailable}
              />

              {/* Utility bar: Menu + Cart + restaurant phone */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex h-9 items-center gap-1.5 rounded-full border bg-background px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <IconToolsKitchen2 className="size-3.5 text-primary" />
                  Menu
                </button>

                {cartCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("details")}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.97]"
                  >
                    <IconShoppingCart className="size-3.5" />
                    <span>{cartCount} {cartCount === 1 ? "item" : "items"}</span>
                    <span className="opacity-75">·</span>
                    <span>{formatMoney(cartTotal)}</span>
                  </button>
                )}

                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex h-9 items-center gap-1.5 rounded-full border bg-background px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <IconPhone className="size-3.5 text-muted-foreground" />
                    Call Restaurant
                  </a>
                )}
              </div>

              {/* Status label below mic */}
              {!voiceActive && voiceState !== "error" && (
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  {voiceUnavailable
                    ? voiceUnavailableMessage
                    : "Tap the microphone to start your voice order"}
                </p>
              )}
              {voiceState === "error" && voiceError && (
                <p className="mt-2 text-center text-xs text-destructive">{voiceError}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cart sidebar (desktop only) ──────────────────── */}
        <aside className="hidden w-80 flex-col border-l bg-card lg:flex xl:w-96">
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

      {/* ── Menu sheet ─────────────────────────────────────────────── */}
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

      {/* ── Checkout sheet ─────────────────────────────────────────── */}
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

// ─── Order Page Header ────────────────────────────────────────────────────────

function OrderHeader({
  restaurantName,
  restaurantLogo,
  open,
  nextOpen,
  phone,
  cartCount,
  onMenu,
  onCart,
}: {
  restaurantName: string;
  restaurantLogo: string | null;
  open: boolean;
  nextOpen: string | null;
  phone: string | null;
  cartCount: number;
  onMenu: () => void;
  onCart: () => void;
}) {
  return (
    <header className="shrink-0 border-b bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">

        {/* Left: Restaurant identity */}
        <div className="flex min-w-0 items-center gap-3">
          {restaurantLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurantLogo}
              alt={restaurantName}
              className="size-9 shrink-0 rounded-xl border object-cover shadow-sm"
            />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-primary/10">
              <IconToolsKitchen2 className="size-4.5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{restaurantName}</p>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  open ? "bg-emerald-500" : "bg-amber-400",
                )}
              />
              <span className={cn("text-[11px] font-medium", open ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                {open ? "Open now" : nextOpen ? `Opens ${nextOpen}` : "Closed"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Menu button — desktop only */}
          <button
            type="button"
            onClick={onMenu}
            className="hidden items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted md:flex"
          >
            <IconMenu2 className="size-3.5" />
            Menu
          </button>

          {/* Phone — desktop only */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="hidden items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted md:flex"
            >
              <IconPhone className="size-3.5 text-muted-foreground" />
              Call Restaurant
            </a>
          )}

          {/* Cart button — always visible */}
          <button
            type="button"
            onClick={onCart}
            className="relative flex size-9 items-center justify-center rounded-xl border bg-background transition-colors hover:bg-muted"
            aria-label="Open cart"
          >
            <IconShoppingCart className="size-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <ThemeToggler className="size-9 rounded-xl" />
        </div>
      </div>
    </header>
  );
}

// ─── Restaurant Hero (pre-conversation state) ─────────────────────────────────

function RestaurantHero({
  restaurant,
  greeting,
  open,
  nextOpen,
  voiceUnavailable,
  voiceUnavailableMessage,
}: {
  restaurant: {
    name: string;
    logo?: string | null;
    phone?: string | null;
  };
  greeting: string;
  open: boolean;
  nextOpen: string | null;
  voiceUnavailable: boolean;
  voiceUnavailableMessage: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      {/* Logo / icon */}
      <div className="relative">
        {restaurant.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logo}
            alt={restaurant.name}
            className="size-20 rounded-3xl border-2 border-border object-cover shadow-sm"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-3xl border-2 border-border bg-muted shadow-sm">
            <IconToolsKitchen2 className="size-9 text-primary/60" />
          </div>
        )}
        {/* Open/closed dot */}
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-card",
            open ? "bg-emerald-500" : "bg-amber-400",
          )}
        />
      </div>

      {/* Name + status */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{restaurant.name}</h2>
        <p className={cn("text-xs font-medium", open ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
          {open ? "Open now · Taking orders" : nextOpen ? `Opens ${nextOpen}` : "Currently closed"}
        </p>
      </div>

      {/* AI greeting */}
      <div className="flex items-start gap-2.5 rounded-2xl border bg-muted/60 px-4 py-3 text-left text-sm leading-relaxed max-w-xs">
        <div className="relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <IconRobot className="size-3 text-primary" />
          <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full border border-card bg-emerald-500" />
        </div>
        <p className="text-muted-foreground">{greeting}</p>
      </div>

      {/* Voice unavailable warning */}
      {voiceUnavailable && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
          <IconAlertTriangle className="size-3.5 shrink-0" />
          <span>{voiceUnavailableMessage}</span>
        </div>
      )}
    </div>
  );
}

// ─── Large Mic Button ─────────────────────────────────────────────────────────

function MicButton({
  state,
  onStart,
  onStop,
  disabled,
}: {
  state: VoiceCallState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}) {
  const active =
    state === "connecting" ||
    state === "speaking" ||
    state === "listening" ||
    state === "thinking";

  const colorMap: Record<VoiceCallState, string> = {
    idle: "bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40",
    connecting: "bg-muted text-muted-foreground shadow-black/10 cursor-wait",
    listening: "bg-rose-500 text-white shadow-rose-500/40 hover:bg-rose-600",
    speaking: "bg-primary text-primary-foreground shadow-primary/30",
    thinking: "bg-amber-500 text-white shadow-amber-500/30 cursor-wait",
    error: "bg-destructive text-destructive-foreground shadow-destructive/20 hover:bg-destructive/90",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Outer breathing ring — listening */}
        {state === "listening" && (
          <>
            <span className="absolute size-28 animate-ping rounded-full bg-rose-500/15 md:size-32" />
            <span className="absolute size-24 animate-pulse rounded-full bg-rose-500/10 md:size-28" />
          </>
        )}
        {/* Speaking ring */}
        {state === "speaking" && (
          <span className="absolute size-24 animate-pulse rounded-full bg-primary/15 md:size-28" />
        )}

        <button
          type="button"
          onClick={active ? onStop : onStart}
          disabled={disabled && state === "idle" || state === "connecting" || state === "thinking"}
          aria-label={active ? "Stop voice order" : "Start voice order"}
          className={cn(
            "relative flex size-20 items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-95 md:size-24",
            colorMap[state],
            (disabled && state === "idle") && "opacity-40 cursor-not-allowed",
          )}
        >
          {state === "connecting" && (
            <IconLoader className="size-8 animate-spin md:size-10" />
          )}
          {state === "thinking" && (
            <IconLoader className="size-8 animate-spin md:size-10" />
          )}
          {state === "listening" && (
            <IconMicrophone className="size-8 md:size-10" />
          )}
          {state === "speaking" && (
            <IconVolume className="size-8 md:size-10" />
          )}
          {state === "idle" && (
            <IconMicrophone className="size-8 md:size-10" />
          )}
          {state === "error" && (
            <IconAlertTriangle className="size-8 md:size-10" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Transcript Chip ──────────────────────────────────────────────────────────

function TranscriptChip({
  state,
  transcript,
  error,
}: {
  state: VoiceCallState;
  transcript: string;
  error: string | null;
}) {
  if (state === "idle") return null;
  if (state === "error" && error) return null; // shown below button instead

  const text =
    state === "connecting"
      ? "Connecting to voice ordering…"
      : state === "thinking"
        ? "Processing your order…"
        : state === "speaking"
          ? "AI is speaking — listening next…"
          : transcript || "Listening… speak now";

  const isLive = state === "listening" && transcript;

  return (
    <div
      className={cn(
        "mb-3 flex min-h-[2.5rem] items-center justify-center rounded-2xl border px-4 py-2 text-center text-sm transition-all",
        isLive
          ? "border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-300"
          : "border-border bg-muted/60 text-muted-foreground",
      )}
    >
      <span className="line-clamp-2">{text}</span>
    </div>
  );
}

// ─── Transcript bubbles ───────────────────────────────────────────────────────

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

// ─── Cart Sidebar (desktop) ───────────────────────────────────────────────────

function CartSidebar({
  cart,
  cartCount,
  cartTotal,
  photoMap,
  onIncrement,
  onDecrement,
  onRemove,
  onCheckout,
  onBrowseMenu,
}: {
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
    <div className="flex h-full flex-col overflow-hidden">
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
              Start a voice order or browse the menu to add dishes
            </p>
          </div>
          <Button
            onClick={onBrowseMenu}
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
          >
            <IconToolsKitchen2 className="size-3.5" />
            Browse Menu
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-2.5 px-4 py-3">
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
          <div className="shrink-0 space-y-3 border-t bg-card/50 p-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">{formatMoney(cartTotal)}</span>
            </div>
            <Button onClick={onCheckout} className="w-full gap-1.5 rounded-full" size="lg">
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

// ─── Plate Card ───────────────────────────────────────────────────────────────

function PlateCard({
  line,
  photo,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  line: CartLine;
  photo?: string | null;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-sm">
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
      <div className="pb-3 pl-14 pr-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">{line.name}</p>
          <p className="shrink-0 text-sm font-bold text-primary">
            {formatMoney(line.unitPrice * line.quantity)}
          </p>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatMoney(line.unitPrice)} × {line.quantity}
        </p>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border bg-background px-1.5 py-1">
            <button
              type="button"
              onClick={onDecrement}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconMinus className="size-3" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold">
              {line.quantity}
            </span>
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

// ─── Menu Sheet ───────────────────────────────────────────────────────────────

function MenuSheet({
  items,
  filteredItems,
  grouped,
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  cart,
  addedId,
  onAdd,
  onIncrement,
  onDecrement,
  onClose,
  makeId,
}: {
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
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const categories = grouped.map(([cat]) => cat);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto flex max-h-[92dvh] flex-col rounded-t-3xl bg-background md:m-auto md:max-h-[85dvh] md:w-[640px] md:rounded-2xl md:shadow-2xl">
        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold">Browse Menu</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {items.filter((i) => i.available).length} available
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          </div>
        </div>
        <div className="border-b px-5 py-3">
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
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b px-5 py-2.5 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                !activeCategory
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat === activeCategory ? null : cat)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  activeCategory === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-3">
          {filteredItems.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No dishes match your search
            </p>
          )}
          {filteredItems.map((item) => {
            const photo = item.photos?.[0]?.url ?? item.imageUrl ?? null;
            const id = makeId(item);
            const line = cart.find((l) => l.id === id);
            const justAdded = addedId === id;
            return (
              <div
                key={id}
                className={cn(
                  "relative flex gap-3 rounded-2xl border bg-card p-3 transition-all",
                  !item.available ? "opacity-50" : "hover:shadow-sm",
                  line ? "border-primary/30 ring-1 ring-primary/10" : "",
                )}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={item.name}
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <IconToolsKitchen2 className="size-6 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-semibold leading-snug">{item.name}</p>
                    <p className="shrink-0 text-sm font-bold text-primary">
                      {formatMoney(item.basePrice)}
                    </p>
                  </div>
                  {item.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.available
                          ? "text-teal-600 dark:text-teal-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.available ? "Available" : "Sold out"}
                    </span>
                    {item.available &&
                      (line ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onDecrement(line.id)}
                            className="flex size-7 items-center justify-center rounded-full border bg-background hover:bg-muted"
                          >
                            <IconMinus className="size-3" />
                          </button>
                          <span className="min-w-[1.25rem] text-center text-sm font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdd(item)}
                            className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
                          >
                            <IconPlus className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAdd(item)}
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                            justAdded
                              ? "scale-95 border-primary bg-primary text-primary-foreground"
                              : "hover:border-primary hover:bg-primary hover:text-primary-foreground",
                          )}
                        >
                          <IconPlus className="size-3" />
                          Add
                        </button>
                      ))}
                  </div>
                </div>
                {justAdded && (
                  <div className="pointer-events-none absolute inset-0 flex animate-in items-center justify-center rounded-2xl bg-primary/10 duration-300 fade-in-0 zoom-in-95">
                    <IconCircleCheck className="size-8 text-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

// ─── Checkout Sheet ───────────────────────────────────────────────────────────

function CheckoutSheet({
  step,
  cart,
  cartTotal,
  photoMap,
  pricing,
  customer,
  fulfilmentType,
  deliveryPin,
  distanceKm,
  canCheckout,
  checkoutPending,
  restaurant,
  onStep,
  onFulfilment,
  onCustomer,
  onDeliveryPin,
  onDeliveryAddress,
  onCheckout,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  step: CheckoutStep;
  cart: CartLine[];
  cartTotal: number;
  photoMap: Map<string, string>;
  pricing:
    | { itemSubtotal?: number; deliveryFee?: number; serviceFee?: number; totalPayable?: number }
    | undefined;
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
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const total = pricing?.totalPayable ?? cartTotal;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto flex max-h-[95dvh] w-full flex-col rounded-t-3xl bg-background md:m-auto md:max-h-[85dvh] md:max-w-lg md:rounded-2xl md:shadow-2xl">
        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-3">
            {step === "confirm" && (
              <button
                type="button"
                onClick={() => onStep("details")}
                className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              >
                <IconX className="size-3.5 rotate-45" style={{ transform: "rotate(225deg)" }} />
              </button>
            )}
            <h2 className="font-semibold">
              {step === "details" ? "Your Details" : "Confirm Order"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-4" />
          </button>
        </div>

        {step === "details" && (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
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

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                How would you like your order?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    key: "pickup" as const,
                    label: "Pickup",
                    sub: "Collect in-store",
                    icon: IconShoppingBag,
                    disabled: restaurant.pickupEnabled === false,
                  },
                  {
                    key: "delivery" as const,
                    label: "Delivery",
                    sub: "Delivered to you",
                    icon: IconTruck,
                    disabled: restaurant.deliveryEnabled === false,
                  },
                ].map(({ key, label, sub, icon: Icon, disabled }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => onFulfilment(key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3.5 text-center transition-all",
                      fulfilmentType === key
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20 hover:border-foreground/20",
                      disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5",
                        fulfilmentType === key ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                    {fulfilmentType === key && (
                      <IconCircleCheck className="size-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Your details
              </p>
              <CheckoutField
                label="Full name"
                placeholder="Your name"
                value={customer.name}
                onChange={(v) => onCustomer("name", v)}
              />
              <CheckoutField
                label="Phone"
                placeholder="+234 800 000 0000"
                value={customer.phone}
                onChange={(v) => onCustomer("phone", v)}
                type="tel"
              />
              <CheckoutField
                label="Email"
                placeholder="you@example.com"
                value={customer.email}
                onChange={(v) => onCustomer("email", v)}
                type="email"
              />
            </div>

            {fulfilmentType === "delivery" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Delivery address
                </p>
                <AddressPicker
                  value={customer.address}
                  placeholder="Search your delivery address…"
                  onChange={(result: AddressResult | null) => {
                    onDeliveryAddress(result?.address ?? "");
                    onDeliveryPin(result ? { lat: result.lat, lng: result.lng } : null);
                  }}
                />
                {deliveryPin && (
                  <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 dark:border-teal-800 dark:bg-teal-950/30">
                    <IconMapPin className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-teal-700 dark:text-teal-300">
                        {customer.address}
                      </p>
                      <p className="text-[11px] text-teal-600/70 dark:text-teal-400/60">
                        {distanceKm.toFixed(1)} km from restaurant
                      </p>
                    </div>
                  </div>
                )}
                <CheckoutField
                  label="Landmark (optional)"
                  placeholder="Nearest bus stop"
                  value={customer.landmark}
                  onChange={(v) => onCustomer("landmark", v)}
                />
              </div>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="overflow-hidden rounded-2xl border bg-muted/20">
              <div className="divide-y">
                {cart.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="flex-1 truncate">
                      {line.quantity}× {line.name}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatMoney(line.unitPrice * line.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 border-t px-4 py-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatMoney(pricing?.itemSubtotal ?? cartTotal)}</span>
                </div>
                {fulfilmentType === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>
                      {pricing?.deliveryFee != null
                        ? formatMoney(pricing.deliveryFee)
                        : "Calculating…"}
                    </span>
                  </div>
                )}
                {(pricing?.serviceFee ?? 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service fee</span>
                    <span>{formatMoney(pricing!.serviceFee!)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                {fulfilmentType === "delivery" ? (
                  <IconTruck className="size-4 shrink-0" />
                ) : (
                  <IconShoppingBag className="size-4 shrink-0" />
                )}
                <span className="font-medium capitalize text-foreground">{fulfilmentType}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconUser className="size-4 shrink-0" />
                <span>
                  {customer.name} · {customer.phone}
                </span>
              </div>
              {fulfilmentType === "delivery" && customer.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <IconMapPin className="mt-0.5 size-4 shrink-0" />
                  <span className="leading-snug">
                    {customer.address}
                    {customer.landmark ? ` · ${customer.landmark}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2.5 border-t p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {step === "details" ? (
            <Button
              className="h-12 w-full gap-2 rounded-full text-base"
              disabled={!canCheckout}
              onClick={() => onStep("confirm")}
            >
              Review Order <IconCircleCheck className="size-4" />
            </Button>
          ) : (
            <Button
              className="h-12 w-full gap-2 rounded-full text-base"
              disabled={!canCheckout || checkoutPending}
              onClick={onCheckout}
            >
              {checkoutPending ? (
                <>
                  <IconLoader className="size-5 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <IconCircleCheck className="size-5" />
                  Pay {formatMoney(total)}
                </>
              )}
            </Button>
          )}
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <IconShieldCheck className="size-3.5" />
            Secured by Paystack · Flutterwave
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Email Capture Card ───────────────────────────────────────────────────────

function EmailCaptureCard({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitted(true);
    onSubmit(trimmed);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <IconCircleCheck className="size-4 shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Got it! Payment link and receipt will be sent to{" "}
          <span className="font-bold">{value.trim()}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <IconMail className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-snug">Enter your email</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We&apos;ll send your payment link and receipt here.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1 text-sm"
          autoFocus
        />
        <Button size="sm" onClick={handleSubmit} className="shrink-0 gap-1.5">
          <IconArrowRight className="size-3.5" />
        </Button>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Checkout Field ───────────────────────────────────────────────────────────

function CheckoutField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 text-sm"
      />
    </div>
  );
}
