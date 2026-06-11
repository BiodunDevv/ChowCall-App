"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconWorld } from "@tabler/icons-react";

type PublicAiPageConfig = {
  coverImageUrl?: string;
  description?: string;
  category?: string;
  instagramUrl?: string;
  whatsappNumber?: string;
  bannerText?: string;
  bannerEnabled?: boolean;
  showPopularItems?: boolean;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  estimatedPrepTime?: number;
};

export function StorefrontSection() {
  const [form, setForm] = useState<PublicAiPageConfig>({
    bannerEnabled: false,
    showPopularItems: true,
    pickupEnabled: true,
    deliveryEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: PublicAiPageConfig }>("/v1/tenants/current/public-page")
      .then((res) => {
        if (res.data) setForm((prev) => ({ ...prev, ...res.data }));
      })
      .catch(() => {});
  }, []);

  function set<K extends keyof PublicAiPageConfig>(key: K, value: PublicAiPageConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await api("/v1/tenants/current/public-page", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Public AI page saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save public AI page");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWorld className="size-4" />
          Public AI Page
        </CardTitle>
        <CardDescription>
          Control what customers see on your ChowCall AI ordering link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Banner */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Announcement Banner</h3>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm">Show banner</p>
              <p className="text-xs text-muted-foreground">Display a notice at the top of your landing page</p>
            </div>
            <Switch checked={form.bannerEnabled ?? false} onCheckedChange={(v) => set("bannerEnabled", v)} />
          </div>
          {form.bannerEnabled && (
            <div className="space-y-1.5">
              <Label>Banner text</Label>
              <Input
                placeholder="e.g. Free delivery on orders above ₦10,000 today!"
                value={form.bannerText ?? ""}
                onChange={(e) => set("bannerText", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Cover image */}
        <div className="space-y-1.5">
          <Label>Cover image URL</Label>
          <Input
            placeholder="https://your-cdn.com/cover.jpg"
            value={form.coverImageUrl ?? ""}
            onChange={(e) => set("coverImageUrl", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Used as the cover image on your public AI ordering page</p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={3}
            placeholder="Tell customers what makes your restaurant special…"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Food category</Label>
          <Input
            placeholder="e.g. Nigerian Cuisine, Fast Food, Pizza"
            value={form.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
          />
        </div>

        {/* Social */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Instagram URL</Label>
            <Input
              placeholder="https://instagram.com/yourhandle"
              value={form.instagramUrl ?? ""}
              onChange={(e) => set("instagramUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp number</Label>
            <Input
              placeholder="+2348000000001"
              value={form.whatsappNumber ?? ""}
              onChange={(e) => set("whatsappNumber", e.target.value)}
            />
          </div>
        </div>

        {/* Prep time */}
        <div className="space-y-1.5">
          <Label>Estimated prep time (minutes)</Label>
          <Input
            type="number"
            min={0}
            placeholder="e.g. 25"
            value={form.estimatedPrepTime ?? ""}
            onChange={(e) => set("estimatedPrepTime", Number(e.target.value) || undefined)}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Ordering options</h3>
          {[
            { key: "showPopularItems" as const, label: "Show popular items", desc: "Display menu item previews on the landing page" },
            { key: "pickupEnabled" as const, label: "Pickup", desc: "Allow customers to pick up orders" },
            { key: "deliveryEnabled" as const, label: "Delivery", desc: "Allow customers to request delivery" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={form[key] ?? false} onCheckedChange={(v) => set(key, v)} />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save public page"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
