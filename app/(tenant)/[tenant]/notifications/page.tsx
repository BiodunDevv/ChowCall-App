"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/public-ordering";
import {
  IconBell,
  IconBellOff,
  IconShoppingCart,
  IconCircleCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconVolume,
  IconMail,
  IconDeviceMobile,
  IconCheck,
  IconClock,
  IconX,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TenantOrder = {
  _id: string;
  status: string;
  source: string;
  customer?: { name?: string };
  pricing?: { totalPayable?: number };
  createdAt?: string;
};

type NotifItem = {
  id: string;
  type: "order" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: "order" | "check" | "alert" | "info";
};

// ─── localStorage keys ────────────────────────────────────────────────────────

const LS_SOUND  = "chowcall_notif_sound";
const LS_EMAIL  = "chowcall_notif_email";

type EmailPrefs = {
  orderUpdates: boolean;
  weeklySummary: boolean;
  systemAlerts: boolean;
};

const DEFAULT_EMAIL: EmailPrefs = {
  orderUpdates: true,
  weeklySummary: true,
  systemAlerts: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function orderToNotif(order: TenantOrder): NotifItem {
  const amount = order.pricing?.totalPayable
    ? ` · ${formatMoney(order.pricing.totalPayable)}`
    : "";
  const customer = order.customer?.name ?? "Customer";

  const statusMeta: Record<string, { title: string; icon: NotifItem["icon"] }> = {
    PENDING_PAYMENT: { title: `New order from ${customer}${amount}`, icon: "order" },
    CONFIRMED:       { title: `Order confirmed for ${customer}${amount}`, icon: "check" },
    PREPARING:       { title: `Preparing order for ${customer}${amount}`, icon: "order" },
    READY:           { title: `Order ready for ${customer}${amount}`, icon: "check" },
    COMPLETED:       { title: `Order completed for ${customer}${amount}`, icon: "check" },
    CANCELLED:       { title: `Order cancelled for ${customer}${amount}`, icon: "alert" },
  };

  const meta = statusMeta[order.status] ?? {
    title: `Order from ${customer}${amount}`,
    icon: "order" as const,
  };

  return {
    id: order._id,
    type: "order",
    title: meta.title,
    body: `Via ${order.source} · ${order.status.replace(/_/g, " ").toLowerCase()}`,
    time: order.createdAt ?? "",
    read: order.status === "COMPLETED" || order.status === "CANCELLED",
    icon: meta.icon,
  };
}

const SYSTEM_NOTIFICATIONS: NotifItem[] = [
  {
    id: "sys-welcome",
    type: "system",
    title: "Welcome to ChowCall",
    body: "Your restaurant is live and ready to accept orders via AI voice, web, and WhatsApp.",
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    icon: "info",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "orders" | "system">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>(DEFAULT_EMAIL);

  // Load prefs from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification !== "undefined") {
      setPushPermission(Notification.permission);
    }
    try {
      const sound = localStorage.getItem(LS_SOUND);
      if (sound !== null) setSoundEnabled(sound === "true");
      const email = localStorage.getItem(LS_EMAIL);
      if (email) setEmailPrefs({ ...DEFAULT_EMAIL, ...JSON.parse(email) });
    } catch {}
  }, []);

  // Persist prefs
  useEffect(() => {
    try { localStorage.setItem(LS_SOUND, String(soundEnabled)); } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try { localStorage.setItem(LS_EMAIL, JSON.stringify(emailPrefs)); } catch {}
  }, [emailPrefs]);

  // Fetch orders as notification feed
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-orders"],
    queryFn: () => api<{ data: TenantOrder[] }>("/v1/orders"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const orderNotifs = useMemo(
    () => (data?.data ?? []).map(orderToNotif).slice(0, 30),
    [data],
  );

  const allNotifs = useMemo(
    () =>
      [...orderNotifs, ...SYSTEM_NOTIFICATIONS].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      ),
    [orderNotifs],
  );

  const filtered = useMemo(() => {
    if (tab === "orders") return allNotifs.filter((n) => n.type === "order");
    if (tab === "system") return allNotifs.filter((n) => n.type === "system");
    return allNotifs;
  }, [allNotifs, tab]);

  const unreadCount = allNotifs.filter((n) => !n.read && !readIds.has(n.id)).length;

  function markAllRead() {
    setReadIds(new Set(allNotifs.map((n) => n.id)));
  }

  async function requestPush() {
    if (typeof Notification === "undefined") {
      toast.error("Notifications are not supported in this browser");
      return;
    }
    const result = await Notification.requestPermission();
    setPushPermission(result);
    if (result === "granted") {
      toast.success("Push notifications enabled");
    } else if (result === "denied") {
      toast.error("Notifications blocked — please allow them in browser settings");
    }
  }

  return (
    <AppShell>
      {/* ── Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Order alerts, system updates, and notification preferences.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="self-start sm:self-auto gap-1.5">
            <IconCheck className="size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* ── Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">

        {/* ── LEFT: Activity feed */}
        <div className="min-w-0">
          {/* Tab switcher */}
          <div className="mb-4 flex gap-1 rounded-xl border bg-muted/40 p-1">
            {(["all", "orders", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  tab === t
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          )}

          {/* Feed */}
          {!isLoading && (
            <div className="overflow-hidden rounded-xl border">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl border bg-muted">
                    <IconBellOff className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                filtered.map((notif, idx) => {
                  const isRead = notif.read || readIds.has(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => setReadIds((s) => new Set([...s, notif.id]))}
                      className={[
                        "flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40",
                        idx !== filtered.length - 1 ? "border-b" : "",
                        isRead ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      {/* Icon */}
                      <div className={[
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                        notif.icon === "check"  ? "bg-emerald-500/10" :
                        notif.icon === "alert"  ? "bg-red-500/10" :
                        notif.icon === "info"   ? "bg-blue-500/10" :
                        "bg-primary/10",
                      ].join(" ")}>
                        {notif.icon === "check"  && <IconCircleCheck className="size-4 text-emerald-500" />}
                        {notif.icon === "alert"  && <IconAlertCircle className="size-4 text-red-500" />}
                        {notif.icon === "info"   && <IconInfoCircle className="size-4 text-blue-500" />}
                        {notif.icon === "order"  && <IconShoppingCart className="size-4 text-primary" />}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className={["text-sm leading-snug", !isRead ? "font-semibold" : ""].join(" ")}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{notif.body}</p>
                      </div>

                      {/* Right: time + unread dot */}
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <IconClock className="size-2.5" />
                          {timeAgo(notif.time)}
                        </span>
                        {!isRead && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Preferences */}
        <div className="space-y-4">

          {/* Push Notifications */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <IconDeviceMobile className="size-4 text-primary" />
              </div>
              <h2 className="font-semibold">Push Notifications</h2>
            </div>

            {/* Permission status */}
            <div className={[
              "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
              pushPermission === "granted" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
              pushPermission === "denied"  ? "bg-red-500/10 text-red-700 dark:text-red-400" :
              "bg-muted text-muted-foreground",
            ].join(" ")}>
              {pushPermission === "granted" && <IconCircleCheck className="size-3.5" />}
              {pushPermission === "denied"  && <IconX className="size-3.5" />}
              {pushPermission === "default" && <IconBell className="size-3.5" />}
              {pushPermission === "granted" ? "Notifications granted" :
               pushPermission === "denied"  ? "Notifications blocked in browser" :
               "Permission not yet requested"}
            </div>

            {pushPermission !== "granted" && (
              <Button
                size="sm"
                onClick={requestPush}
                className="w-full gap-1.5"
                variant={pushPermission === "denied" ? "outline" : "default"}
              >
                <IconBell className="size-3.5" />
                {pushPermission === "denied" ? "Open browser settings to allow" : "Enable Push Notifications"}
              </Button>
            )}

            {/* Sound toggle */}
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <div className="flex items-center gap-2.5">
                <IconVolume className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Sound alerts</p>
                  <p className="text-xs text-muted-foreground">Play a chime on new orders</p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </div>

          {/* Email Notifications */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <IconMail className="size-4 text-primary" />
              </div>
              <h2 className="font-semibold">Email Notifications</h2>
            </div>

            <p className="text-xs text-muted-foreground">
              Choose which emails you receive from ChowCall.
            </p>

            <div className="space-y-3">
              {(
                [
                  {
                    key: "orderUpdates" as const,
                    label: "Order updates",
                    desc: "Confirmation, status changes, and receipts",
                  },
                  {
                    key: "weeklySummary" as const,
                    label: "Weekly summary",
                    desc: "Revenue, orders, and performance every Monday",
                  },
                  {
                    key: "systemAlerts" as const,
                    label: "System alerts",
                    desc: "Downtime, billing, and important account notices",
                  },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={emailPrefs[key]}
                    onCheckedChange={(v) =>
                      setEmailPrefs((p) => ({ ...p, [key]: v }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
