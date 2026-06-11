"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/auth";
import { api } from "@/lib/api/client";
import { logoutToRootSignin } from "@/lib/logout";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const LS_EMAIL = "cc_email_notifications";
const LS_SOUND = "cc_notification_sound";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Profile
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  // Security dialog
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twoFaEnabled ?? true);

  // Notifications
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushGranted, setPushGranted] = useState<NotificationPermission | null>(null);
  const [soundNotif, setSoundNotif] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEmailNotif(localStorage.getItem(LS_EMAIL) === "true");
      setSoundNotif(localStorage.getItem(LS_SOUND) === "true");
      if ("Notification" in window) {
        setPushGranted(Notification.permission);
      }
    }
  }, []);

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
          ? "OTP verification has been turned off."
          : "OTP verification is enabled for sign in.",
      );
    },
    onError: (error) => {
      setTwoFaEnabled(user?.twoFaEnabled ?? true);
      toast.error(error instanceof Error ? error.message : "Could not update security settings");
    },
  });

  async function saveName() {
    if (!nameValue.trim()) return;
    setSavingName(true);
    try {
      await api("/v1/tenants/current", {
        method: "PATCH",
        body: JSON.stringify({ name: nameValue }),
      });
      toast.success("Name updated");
      setEditingName(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update name");
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword() {
    if (!currentPw || !newPw) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      await api<void>("/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      toast.success("Password updated");
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

  async function signOutAllDevices() {
    await logoutToRootSignin(clearAuth);
  }

  async function handlePushToggle(checked: boolean) {
    if (!checked) {
      setPushGranted(null);
      return;
    }
    if (!("Notification" in window)) {
      toast.error("Browser notifications are not supported");
      return;
    }
    const perm = await Notification.requestPermission();
    setPushGranted(perm);
    if (perm === "denied") {
      toast.error("Permission denied — please allow notifications in your browser settings");
    }
  }

  return (
    <AppShell>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Section 1: Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your public identity on ChowCall</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="h-9"
                  />
                  <Button size="sm" onClick={saveName} disabled={savingName}>
                    {savingName ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(user?.name ?? "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">{user?.name ?? "—"}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingName(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                {user?.role ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 2FA */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security to your account using OTP verification
                </p>
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
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Change password</p>
                <p className="text-xs text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPwDialogOpen(true)}>
                Change
              </Button>
            </div>

            {/* Active sessions */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Active sessions</p>
                <p className="text-xs text-muted-foreground">
                  Sign out from all devices and browsers
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={signOutAllDevices}>
                Sign out all devices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Control how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Email notifications */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Email notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive order and system updates via email
                </p>
              </div>
              <Switch
                checked={emailNotif}
                onCheckedChange={(v) => {
                  setEmailNotif(v);
                  localStorage.setItem(LS_EMAIL, String(v));
                }}
              />
            </div>

            {/* Push notifications */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Browser push notifications</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    Get real-time alerts in your browser
                  </p>
                  {pushGranted && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        pushGranted === "granted"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : pushGranted === "denied"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {pushGranted === "granted"
                        ? "Granted"
                        : pushGranted === "denied"
                        ? "Denied"
                        : "Not set"}
                    </span>
                  )}
                </div>
              </div>
              <Switch
                checked={pushGranted === "granted"}
                onCheckedChange={handlePushToggle}
              />
            </div>

            {/* Notification sound */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Notification sound</p>
                <p className="text-xs text-muted-foreground">
                  Play a sound when new orders arrive
                </p>
              </div>
              <Switch
                checked={soundNotif}
                onCheckedChange={(v) => {
                  setSoundNotif(v);
                  localStorage.setItem(LS_SOUND, String(v));
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change password dialog */}
      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={changePassword} disabled={savingPw}>
              {savingPw ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
