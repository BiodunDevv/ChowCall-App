"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { useAuthStore } from "@/stores/auth-store";
import { getUserTenantSlug } from "@/lib/auth";
import {
  IconWorld,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconPhoto,
  IconExternalLink,
  IconLoader,
  IconSpeakerphone,
  IconToolsKitchen2,
  IconTruck,
  IconShoppingBag,
  IconCheck,
  IconLetterCase,
} from "@tabler/icons-react";

type StorefrontConfig = {
  logoUrl: string;
  coverImageUrl: string;
  heroHeadline: string;
  description: string;
  category: string;
  instagramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  websiteUrl: string;
  whatsappNumber: string;
  bannerText: string;
  bannerEnabled: boolean;
  showPopularItems: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  estimatedPrepTime: number | "";
};

const DEFAULTS: StorefrontConfig = {
  logoUrl: "",
  coverImageUrl: "",
  heroHeadline: "",
  description: "",
  category: "",
  instagramUrl: "",
  twitterUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  websiteUrl: "",
  whatsappNumber: "",
  bannerText: "",
  bannerEnabled: false,
  showPopularItems: true,
  pickupEnabled: true,
  deliveryEnabled: true,
  estimatedPrepTime: "",
};

export function StorefrontSection() {
  const user = useAuthStore((s) => s.user);
  const tenantSlug = getUserTenantSlug(user);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<StorefrontConfig>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const seeded = useRef(false);

  const { isLoading, data: storefrontData } = useQuery({
    queryKey: ["storefront-config"],
    queryFn: () => api<{ data?: Partial<StorefrontConfig> }>("/v1/tenants/current/public-page"),
  });

  useEffect(() => {
    if (seeded.current || !storefrontData?.data) return;
    seeded.current = true;
    const d = storefrontData.data;
    setForm((prev) => ({
      ...prev,
      ...d,
      estimatedPrepTime: d.estimatedPrepTime ?? "",
    }));
  }, [storefrontData]);

  const save = useMutation({
    mutationFn: () =>
      api("/v1/tenants/current/public-page", {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          estimatedPrepTime: form.estimatedPrepTime === "" ? null : Number(form.estimatedPrepTime),
        }),
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      queryClient.invalidateQueries({ queryKey: ["storefront-config"] });
      toast.success("Public page saved");
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    },
  });

  function set<K extends keyof StorefrontConfig>(key: K, value: StorefrontConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const publicUrl = tenantSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${tenantSlug}`
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <IconLoader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="divide-y rounded-2xl border bg-card overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconWorld className="size-4 text-primary" />
            <h2 className="font-semibold text-base">Public AI Page</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Customise what customers see when they visit your ChowCall ordering link.
          </p>
        </div>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <IconExternalLink className="size-3.5" />
            Preview page
          </a>
        )}
      </div>

      {/* ── Announcement Banner ─────────────────────────────────────────── */}
      <Section
        icon={IconSpeakerphone}
        title="Announcement Banner"
        description="Display a notice bar at the top of your page — great for promos or hours changes."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Show banner</p>
            <p className="text-xs text-muted-foreground">Customers see this the moment they land on your page</p>
          </div>
          <Switch checked={form.bannerEnabled} onCheckedChange={(v) => set("bannerEnabled", v)} />
        </div>
        <Field label="Banner text" hint="Max 140 characters">
          <Input
            maxLength={140}
            placeholder="e.g. Free delivery on orders above ₦10,000 today! 🔥"
            value={form.bannerText}
            onChange={(e) => set("bannerText", e.target.value)}
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">{form.bannerText.length}/140</p>
        </Field>
      </Section>

      {/* ── Branding ────────────────────────────────────────────────────── */}
      <Section
        icon={IconToolsKitchen2}
        title="Branding"
        description="Your logo and cover image — used in the page header and hero section."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <IconToolsKitchen2 className="size-3.5 text-muted-foreground" />
              Restaurant logo
            </Label>
            <ImageUploadField
              value={form.logoUrl}
              onChange={(url) => set("logoUrl", url)}
              aspect="square"
              placeholder="Upload logo"
              hint="Square image, PNG or JPG"
            />
          </div>

          {/* Cover */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <IconPhoto className="size-3.5 text-muted-foreground" />
              Hero cover image
            </Label>
            <ImageUploadField
              value={form.coverImageUrl}
              onChange={(url) => set("coverImageUrl", url)}
              aspect="video"
              placeholder="Upload cover image"
              hint="Landscape image, shown in hero bg"
            />
          </div>
        </div>
      </Section>

      {/* ── Restaurant Identity ─────────────────────────────────────────── */}
      <Section
        icon={IconLetterCase}
        title="Restaurant Identity"
        description="Control the text customers read on your public ordering page."
      >
        <Field label="Hero headline" hint="Max 120 characters — the big text in your hero">
          <Input
            maxLength={120}
            placeholder={`Order from your restaurant with ChowCall AI.`}
            value={form.heroHeadline}
            onChange={(e) => set("heroHeadline", e.target.value)}
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">{form.heroHeadline.length}/120</p>
        </Field>

        <Field label="Short description" hint="Up to 600 characters">
          <Textarea
            rows={3}
            maxLength={600}
            placeholder="Tell customers what makes your restaurant special — cuisine style, signature dishes, vibe…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">{form.description.length}/600</p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Food category">
            <Input
              placeholder="e.g. Nigerian Cuisine, Fast Food, Pizza"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </Field>
          <Field label="Estimated prep time (mins)">
            <Input
              type="number"
              min={0}
              max={240}
              placeholder="e.g. 25"
              value={form.estimatedPrepTime}
              onChange={(e) =>
                set("estimatedPrepTime", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </Field>
        </div>
      </Section>

      {/* ── Socials & Links ─────────────────────────────────────────────── */}
      <Section
        icon={IconBrandInstagram}
        title="Socials & Links"
        description="These appear in the contact section of your public page."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SocialField
            icon={IconBrandWhatsapp}
            iconColor="text-emerald-600"
            label="WhatsApp number"
            placeholder="+2348000000000"
            value={form.whatsappNumber}
            onChange={(v) => set("whatsappNumber", v)}
          />
          <SocialField
            icon={IconBrandInstagram}
            iconColor="text-pink-500"
            label="Instagram"
            placeholder="https://instagram.com/yourhandle"
            value={form.instagramUrl}
            onChange={(v) => set("instagramUrl", v)}
          />
          <SocialField
            icon={IconBrandTwitter}
            iconColor="text-sky-500"
            label="X / Twitter"
            placeholder="https://x.com/yourhandle"
            value={form.twitterUrl}
            onChange={(v) => set("twitterUrl", v)}
          />
          <SocialField
            icon={IconBrandFacebook}
            iconColor="text-blue-600"
            label="Facebook"
            placeholder="https://facebook.com/yourpage"
            value={form.facebookUrl}
            onChange={(v) => set("facebookUrl", v)}
          />
          <SocialField
            icon={IconBrandTiktok}
            iconColor="text-foreground"
            label="TikTok"
            placeholder="https://tiktok.com/@yourhandle"
            value={form.tiktokUrl}
            onChange={(v) => set("tiktokUrl", v)}
          />
          <SocialField
            icon={IconWorld}
            iconColor="text-muted-foreground"
            label="Website"
            placeholder="https://yourrestaurant.com"
            value={form.websiteUrl}
            onChange={(v) => set("websiteUrl", v)}
          />
        </div>
      </Section>

      {/* ── Ordering Options ────────────────────────────────────────────── */}
      <Section
        icon={IconTruck}
        title="Ordering Options"
        description="Control which fulfilment methods and previews customers can see."
      >
        <div className="space-y-4">
          <Toggle
            icon={IconShoppingBag}
            label="Pickup"
            description="Customers can choose to collect their order"
            checked={form.pickupEnabled}
            onChange={(v) => set("pickupEnabled", v)}
          />
          <Toggle
            icon={IconTruck}
            label="Delivery"
            description="Customers can request delivery to their address"
            checked={form.deliveryEnabled}
            onChange={(v) => set("deliveryEnabled", v)}
          />
          <Toggle
            icon={IconPhoto}
            label="Show popular menu items"
            description="Display up to 6 item previews on your landing page"
            checked={form.showPopularItems}
            onChange={(v) => set("showPopularItems", v)}
          />
        </div>
      </Section>

      {/* ── Save ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-xs text-muted-foreground">
          Changes appear on your public page immediately after saving.
        </p>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="shrink-0 gap-2 rounded-full"
        >
          {save.isPending ? (
            <IconLoader className="size-4 animate-spin" />
          ) : saved ? (
            <IconCheck className="size-4" />
          ) : null}
          {save.isPending ? "Saving…" : saved ? "Saved!" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="space-y-4 pl-11">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SocialField({
  icon: Icon,
  iconColor,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        <Icon className={`size-3.5 ${iconColor}`} />
        {label}
      </Label>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
    </div>
  );
}

function Toggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
