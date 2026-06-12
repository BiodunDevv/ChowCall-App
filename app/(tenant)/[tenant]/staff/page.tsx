"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import {
  IconUsers,
  IconPlus,
  IconPencil,
  IconUserOff,
  IconLoader,
  IconCheck,
  IconCopy,
  IconShieldCheck,
  IconKey,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Membership = {
  tenantId: string;
  roles: string[];
  active: boolean;
};

type StaffMember = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  memberships?: Membership[];
  disabledAt?: string;
  createdAt?: string;
};

type InviteForm = {
  name: string;
  email: string;
  phone: string;
  roles: string[];
};

const BLANK_INVITE: InviteForm = {
  name: "",
  email: "",
  phone: "",
  roles: ["viewer"],
};

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLES = [
  { value: "viewer",        label: "Viewer",        desc: "Read-only access to orders and menu" },
  { value: "kitchen_staff", label: "Kitchen Staff",  desc: "Can update order status and inventory" },
  { value: "manager",       label: "Manager",        desc: "Full operations access, can invite staff" },
  { value: "tenant_admin",  label: "Admin",          desc: "Full access except billing" },
] as const;

type RoleValue = typeof ROLES[number]["value"];

const ROLE_STYLE: Record<string, string> = {
  viewer:        "bg-muted text-muted-foreground",
  kitchen_staff: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  manager:       "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  tenant_admin:  "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  tenant_owner:  "bg-primary/10 text-primary",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getMemberRoles(member: StaffMember): string[] {
  return member.memberships?.flatMap((m) => m.roles) ?? [];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const queryClient = useQueryClient();

  // Modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>(BLANK_INVITE);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);

  const [confirmDisableId, setConfirmDisableId] = useState<string | null>(null);

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-staff"],
    queryFn: () => api<{ data: StaffMember[] }>("/v1/staff"),
    staleTime: 30_000,
  });

  const staff = data?.data ?? [];

  // ── Mutations
  const inviteMutation = useMutation({
    mutationFn: (body: object) =>
      api<{ data: StaffMember; temporaryPassword?: string | null }>("/v1/staff/invite", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-staff"] });
      if (res.temporaryPassword) {
        setTempPassword(res.temporaryPassword);
      } else {
        toast.success("Staff member added");
        closeInvite();
      }
    },
    onError: () => toast.error("Failed to invite staff member"),
  });

  const rolesMutation = useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      api(`/v1/staff/${id}/roles`, {
        method: "PATCH",
        body: JSON.stringify({ roles }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-staff"] });
      toast.success("Roles updated");
      setEditMember(null);
    },
    onError: () => toast.error("Failed to update roles"),
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/v1/staff/${id}/disable`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-staff"] });
      toast.success("Staff member deactivated");
      setConfirmDisableId(null);
    },
    onError: () => toast.error("Failed to deactivate staff member"),
  });

  // ── Invite helpers
  function closeInvite() {
    setInviteOpen(false);
    setInviteForm(BLANK_INVITE);
    setTempPassword(null);
    setCopied(false);
  }

  function setInviteField(key: keyof InviteForm, val: string | string[]) {
    setInviteForm((p) => ({ ...p, [key]: val }));
  }

  function toggleInviteRole(role: string) {
    setInviteForm((p) => ({
      ...p,
      roles: p.roles.includes(role)
        ? p.roles.filter((r) => r !== role)
        : [...p.roles, role],
    }));
  }

  function handleInviteSubmit() {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (inviteForm.roles.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    inviteMutation.mutate({
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      phone: inviteForm.phone.trim() || undefined,
      roles: inviteForm.roles,
    });
  }

  async function copyPassword() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Edit roles helpers
  function openEditRoles(member: StaffMember) {
    setEditMember(member);
    setEditRoles(getMemberRoles(member));
  }

  function toggleEditRole(role: string) {
    setEditRoles((p) =>
      p.includes(role) ? p.filter((r) => r !== role) : [...p, role],
    );
  }

  return (
    <AppShell>
      {/* ── Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team — invite members, assign roles, and control access.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-1.5 self-start sm:self-auto">
          <IconPlus className="size-4" />
          Invite Staff
        </Button>
      </div>

      {/* ── Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty */}
      {!isLoading && staff.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted">
            <IconUsers className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No staff yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Invite your first team member to help manage orders and the kitchen.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="gap-1.5">
            <IconPlus className="size-4" />
            Invite First Member
          </Button>
        </div>
      )}

      {/* ── Staff list */}
      {!isLoading && staff.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          {staff.map((member, idx) => {
            const roles = getMemberRoles(member);
            const isConfirmingDisable = confirmDisableId === member._id;

            return (
              <div
                key={member._id}
                className={[
                  "flex flex-col gap-3 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                  idx !== staff.length - 1 ? "border-b" : "",
                ].join(" ")}
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    {member.phone && (
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    )}
                  </div>
                </div>

                {/* Roles + actions */}
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className={[
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        ROLE_STYLE[role] ?? "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {role.replace(/_/g, " ")}
                    </span>
                  ))}

                  {isConfirmingDisable ? (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5">
                      <p className="text-xs text-destructive">Deactivate?</p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 px-2 text-xs"
                        onClick={() => disableMutation.mutate(member._id)}
                        disabled={disableMutation.isPending}
                      >
                        {disableMutation.isPending ? (
                          <IconLoader className="size-3 animate-spin" />
                        ) : "Yes"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setConfirmDisableId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0"
                        onClick={() => openEditRoles(member)}
                        aria-label="Edit roles"
                      >
                        <IconPencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDisableId(member._id)}
                        aria-label="Deactivate"
                      >
                        <IconUserOff className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) closeInvite(); }}>
        <DialogContent className="sm:max-w-md">
          {tempPassword ? (
            // ── Success: show temp password
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconShieldCheck className="size-5 text-emerald-500" />
                  Staff member invited
                </DialogTitle>
                <DialogDescription>
                  Share this temporary password securely — it will not be shown again.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-3">
                  <IconKey className="size-4 shrink-0 text-muted-foreground" />
                  <code className="flex-1 break-all text-sm font-mono font-semibold">
                    {tempPassword}
                  </code>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
                    aria-label="Copy password"
                  >
                    {copied ? (
                      <IconCheck className="size-3.5 text-emerald-500" />
                    ) : (
                      <IconCopy className="size-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The invited member should log in with their email and this temporary password, then change it immediately.
                </p>
              </div>

              <DialogFooter>
                <Button onClick={closeInvite} className="w-full">Done</Button>
              </DialogFooter>
            </>
          ) : (
            // ── Invite form
            <>
              <DialogHeader>
                <DialogTitle>Invite Staff Member</DialogTitle>
                <DialogDescription>
                  They will receive login credentials to access the tenant dashboard.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-1">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-name">Full Name *</Label>
                  <Input
                    id="staff-name"
                    placeholder="Jane Doe"
                    value={inviteForm.name}
                    onChange={(e) => setInviteField("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-email">Email *</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="jane@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-phone">Phone (optional)</Label>
                  <Input
                    id="staff-phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteField("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Roles *</Label>
                  <div className="space-y-2">
                    {ROLES.map(({ value, label, desc }) => {
                      const selected = inviteForm.roles.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleInviteRole(value)}
                          className={[
                            "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                            selected
                              ? "border-primary/40 bg-primary/5"
                              : "hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <div className={[
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                            selected ? "border-primary bg-primary" : "border-border",
                          ].join(" ")}>
                            {selected && <IconCheck className="size-2.5 text-primary-foreground" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeInvite} disabled={inviteMutation.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleInviteSubmit} disabled={inviteMutation.isPending} className="gap-1.5">
                  {inviteMutation.isPending && <IconLoader className="size-4 animate-spin" />}
                  Send Invite
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Roles Modal */}
      <Dialog open={Boolean(editMember)} onOpenChange={(o) => { if (!o) setEditMember(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Roles</DialogTitle>
            <DialogDescription>
              {editMember?.name} · {editMember?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            {ROLES.map(({ value, label, desc }) => {
              const selected = editRoles.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleEditRole(value)}
                  className={[
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    selected
                      ? "border-primary/40 bg-primary/5"
                      : "hover:bg-muted/40",
                  ].join(" ")}
                >
                  <div className={[
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                    selected ? "border-primary bg-primary" : "border-border",
                  ].join(" ")}>
                    {selected && <IconCheck className="size-2.5 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditMember(null)} disabled={rolesMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editMember) return;
                if (editRoles.length === 0) { toast.error("Select at least one role"); return; }
                rolesMutation.mutate({ id: editMember._id, roles: editRoles });
              }}
              disabled={rolesMutation.isPending}
              className="gap-1.5"
            >
              {rolesMutation.isPending && <IconLoader className="size-4 animate-spin" />}
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
