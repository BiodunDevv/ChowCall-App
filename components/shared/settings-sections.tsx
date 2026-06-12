"use client";

/**
 * Reusable settings section components shared across tenant and super-admin settings.
 * Each section is self-contained with its own state and API calls.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authApi } from "@/lib/auth";
import { api } from "@/lib/api/client";
import { logoutToRootSignin } from "@/lib/logout";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  IconShieldCheck,
  IconShieldOff,
  IconKey,
  IconDevices,
  IconMail,
  IconBell,
  IconVolume,
  IconUser,
  IconPencil,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

const LS_EMAIL = "cc_email_notifications";
const LS_SOUND = "cc_notification_sound";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Profile Section ───────────────────────────────────────────────────────────

export function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function saveName() {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      const res = await api<{ user?: { name?: string } }>("/v1/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: nameValue }),
      });
      useAuthStore.getState().setUser({ ...user!, name: res?.user?.name ?? nameValue });
      toast.success("Name updated");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update name");
    } finally {
      setSaving(false);
    }
  }

  const roleLabel = user?.role
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUser className="size-4" />
          Profile
        </CardTitle>
        <CardDescription>Your identity on the platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
              {user?.name ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{user?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Display name
          </Label>
          {editing ? (
            <div className="flex gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="h-9"
                autoFocus
              />
              <Button size="sm" onClick={saveName} disabled={saving}>
                <IconCheck className="size-3.5" />
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setNameValue(user?.name ?? "");
                }}
              >
                <IconX className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{user?.name ?? "—"}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                className="gap-1.5"
              >
                <IconPencil className="size-3" />
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email address
          </Label>
          <div className="flex items-center gap-2">
            <IconMail className="size-3.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Role
          </Label>
          <Badge variant="secondary" className="font-medium">
            {roleLabel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Security Section ──────────────────────────────────────────────────────────

export function SecuritySection() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twoFaEnabled ?? true);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    setTwoFaEnabled(user?.twoFaEnabled ?? true);
  }, [user?.twoFaEnabled]);

  const security = useMutation({
    mutationFn: (enabled: boolean) =>
      authApi.updateSecurity({ twoFaEnabled: enabled }),
    onSuccess: (response) => {
      if (response.user) {
        useAuthStore.getState().setUser(response.user);
        setTwoFaEnabled(response.user.twoFaEnabled ?? true);
      }
      toast.success(
        response.user?.twoFaEnabled === false
          ? "Two-factor authentication disabled."
          : "Two-factor authentication enabled.",
      );
    },
    onError: (error) => {
      setTwoFaEnabled(user?.twoFaEnabled ?? true);
      toast.error(
        error instanceof Error ? error.message : "Could not update security settings",
      );
    },
  });

  async function changePassword() {
    if (!currentPw || !newPw) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      await api<void>("/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      toast.success("Password updated successfully");
      setPwDialogOpen(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change password");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <Card className="bg-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShieldCheck className="size-4" />
            Security
          </CardTitle>
          <CardDescription>
            Control authentication and access to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {/* 2FA */}
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {twoFaEnabled ? (
                  <IconShieldCheck className="size-4 text-primary" />
                ) : (
                  <IconShieldOff className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">
                  Require a one-time code every time you sign in
                </p>
                <Badge
                  variant={twoFaEnabled ? "default" : "secondary"}
                  className="mt-1 text-[10px]"
                >
                  {twoFaEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <Switch
              checked={twoFaEnabled}
              disabled={security.isPending}
              onCheckedChange={(checked) => {
                setTwoFaEnabled(checked);
                security.mutate(checked);
              }}
            />
          </div>

          {/* Change password */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <IconKey className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">
                  Update your account password
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPwDialogOpen(true)}
            >
              Change password
            </Button>
          </div>

          {/* Sign out all */}
          <div className="flex items-center justify-between gap-4 py-4 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <IconDevices className="size-4 text-destructive" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Active sessions</p>
                <p className="text-xs text-muted-foreground">
                  Sign out from all devices and browsers at once
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => logoutToRootSignin(clearAuth)}
            >
              Sign out all
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password dialog */}
      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && changePassword()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPwDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={changePassword} disabled={savingPw}>
              {savingPw ? "Updating…" : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Notifications Section ─────────────────────────────────────────────────────

export function NotificationsSection() {
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushGranted, setPushGranted] = useState<NotificationPermission | null>(null);
  const [soundNotif, setSoundNotif] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEmailNotif(localStorage.getItem(LS_EMAIL) === "true");
      setSoundNotif(localStorage.getItem(LS_SOUND) === "true");
      if ("Notification" in window) setPushGranted(Notification.permission);
    }
  }, []);

  async function handlePushToggle(checked: boolean) {
    if (!checked) {
      setPushGranted("default");
      return;
    }
    if (!("Notification" in window)) {
      toast.error("Browser notifications are not supported");
      return;
    }
    const perm = await Notification.requestPermission();
    setPushGranted(perm);
    if (perm === "granted") {
      toast.success("Push notifications enabled");
    } else if (perm === "denied") {
      toast.error(
        "Permission denied — enable notifications in your browser settings",
      );
    }
  }

  const pushStatus =
    pushGranted === "granted"
      ? { label: "Granted", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" }
      : pushGranted === "denied"
      ? { label: "Denied", class: "bg-destructive/10 text-destructive" }
      : { label: "Not set", class: "bg-muted text-muted-foreground" };

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBell className="size-4" />
          Notifications
        </CardTitle>
        <CardDescription>
          Control how and when you receive updates
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {/* Email */}
        <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IconMail className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">
                Order updates, system alerts and weekly summaries
              </p>
            </div>
          </div>
          <Switch
            checked={emailNotif}
            onCheckedChange={(v) => {
              setEmailNotif(v);
              localStorage.setItem(LS_EMAIL, String(v));
              toast.success(v ? "Email notifications on" : "Email notifications off");
            }}
          />
        </div>

        {/* Push */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IconBell className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Browser push notifications</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">
                  Real-time alerts in your browser
                </p>
                {pushGranted && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${pushStatus.class}`}
                  >
                    {pushStatus.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Switch
            checked={pushGranted === "granted"}
            onCheckedChange={handlePushToggle}
          />
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between gap-4 py-4 last:pb-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <IconVolume className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Notification sound</p>
              <p className="text-xs text-muted-foreground">
                Play a chime when new orders or alerts arrive
              </p>
            </div>
          </div>
          <Switch
            checked={soundNotif}
            onCheckedChange={(v) => {
              setSoundNotif(v);
              localStorage.setItem(LS_SOUND, String(v));
              toast.success(v ? "Sound notifications on" : "Sound notifications off");
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
