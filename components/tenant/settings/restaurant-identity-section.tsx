"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconBuildingStore, IconLink, IconLoader, IconAlertTriangle } from "@tabler/icons-react";

type Tenant = { name: string; slug: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isValidSlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

// ── Restaurant Name Section ───────────────────────────────────────────────────

export function RestaurantNameSection() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: tenant } = useQuery<Tenant>({
    queryKey: ["tenant-identity"],
    queryFn: async () => {
      const res = await api<{ data: Tenant }>("/v1/tenants/current");
      return res.data;
    },
    staleTime: 60_000,
  });

  const [name, setName] = useState("");

  useEffect(() => {
    if (tenant?.name) setName(tenant.name);
  }, [tenant?.name]);

  const dirty = name.trim() !== "" && name.trim() !== tenant?.name;

  const save = useMutation({
    mutationFn: () =>
      api("/v1/tenants/current", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      }),
    onSuccess: () => {
      // Update auth store so the nav reflects the new name instantly
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.tenant) {
        useAuthStore.getState().setUser({
          ...currentUser,
          tenant: { ...currentUser.tenant, name: name.trim() },
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tenant-identity"] });
      toast.success("Restaurant name updated");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update name");
    },
  });

  return (
    <Card className="bg-background">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <IconBuildingStore className="size-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Restaurant Name</CardTitle>
            <CardDescription>
              The name customers see across your ordering page and emails.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="restaurant-name">Name</Label>
          <Input
            id="restaurant-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mama's Kitchen"
            maxLength={80}
            disabled={save.isPending}
          />
          <p className="text-xs text-muted-foreground">
            This name appears on your public ordering page and in customer emails.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {dirty ? "You have unsaved changes." : ""}
        </span>
        <Button
          type="button"
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate()}
          className="min-w-[100px]"
        >
          {save.isPending ? (
            <IconLoader className="size-4 animate-spin" />
          ) : (
            "Save Name"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Restaurant Slug Section ───────────────────────────────────────────────────

export function RestaurantSlugSection({ currentSlug }: { currentSlug: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: tenant } = useQuery<Tenant>({
    queryKey: ["tenant-identity"],
    queryFn: async () => {
      const res = await api<{ data: Tenant }>("/v1/tenants/current");
      return res.data;
    },
    staleTime: 60_000,
  });

  const [slug, setSlug] = useState(currentSlug);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (tenant?.slug) setSlug(tenant.slug);
  }, [tenant?.slug]);

  const handleChange = (value: string) => {
    setSlug(slugify(value));
  };

  const liveSlug = tenant?.slug ?? currentSlug;
  const dirty = slug !== "" && slug !== liveSlug;
  const valid = isValidSlug(slug);
  const unchanged = slug === liveSlug;

  const save = useMutation({
    mutationFn: () =>
      api("/v1/tenants/current", {
        method: "PATCH",
        body: JSON.stringify({ slug }),
      }),
    onSuccess: () => {
      // Update auth store
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.tenant) {
        useAuthStore.getState().setUser({
          ...currentUser,
          tenant: { ...currentUser.tenant, slug },
          tenantSlug: slug,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tenant-identity"] });
      toast.success("Slug updated — redirecting to your new URL…");
      // Redirect to new slug after a brief delay so toast is visible
      setTimeout(() => {
        router.replace(`/${slug}/settings/general`);
      }, 800);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update slug. It may already be taken.");
    },
  });

  const previewUrl = `chowcall.live/${slug || "…"}`;

  return (
    <>
      <Card className="bg-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <IconLink className="size-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Restaurant Slug</CardTitle>
              <CardDescription>
                Your unique URL identifier. Changing it updates all your public links.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-slug">Slug</Label>
            <div className="flex items-center overflow-hidden rounded-md border bg-muted/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
              <span className="select-none border-r bg-muted px-3 py-2 text-sm text-muted-foreground">
                chowcall.live/
              </span>
              <input
                id="restaurant-slug"
                value={slug}
                onChange={(e) => handleChange(e.target.value)}
                disabled={save.isPending}
                maxLength={50}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="your-restaurant"
              />
            </div>

            {/* Validation feedback */}
            {slug && !valid && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <IconAlertTriangle className="size-3.5" />
                Slug must be 3–50 lowercase letters, numbers, or hyphens — no leading/trailing hyphens.
              </p>
            )}
            {slug && valid && !unchanged && (
              <p className="text-xs text-muted-foreground">
                Preview:{" "}
                <span className="font-medium text-foreground">{previewUrl}</span>
              </p>
            )}
            {unchanged && (
              <p className="text-xs text-muted-foreground">
                Current URL:{" "}
                <span className="font-medium text-foreground">{previewUrl}</span>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex gap-2.5">
              <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-medium">Changing your slug will break existing links.</p>
                <p>
                  Anyone with your old ordering URL or QR code will get a 404. Make sure to update
                  menus, printed materials, and social profiles after saving.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <Badge variant="secondary" className="font-mono text-xs">
            /{liveSlug}
          </Badge>
          <Button
            type="button"
            disabled={!dirty || !valid || save.isPending}
            onClick={() => setConfirmOpen(true)}
            className="min-w-[110px]"
          >
            {save.isPending ? (
              <IconLoader className="size-4 animate-spin" />
            ) : (
              "Change Slug"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change your restaurant slug?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Your public ordering URL will change from{" "}
                  <span className="font-mono font-medium">/{liveSlug}</span> to{" "}
                  <span className="font-mono font-medium text-primary">/{slug}</span>.
                </p>
                <p className="text-destructive">
                  All existing links and QR codes pointing to the old URL will stop working immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                save.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, change slug
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
