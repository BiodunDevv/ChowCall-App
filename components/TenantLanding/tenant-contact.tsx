import {
  IconMapPin,
  IconPhone,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandTwitter,
  IconBrandFacebook,
  IconBrandTiktok,
  IconWorld,
} from "@tabler/icons-react";
import type { PublicTenant } from "@/lib/public-ordering";

type TenantContactProps = {
  restaurant: PublicTenant;
};

type SocialLink = {
  href: string;
  label: string;
  display: string;
  iconClass: string;
  bgClass: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function TenantContact({ restaurant }: TenantContactProps) {
  const socials: SocialLink[] = [
    restaurant.whatsappNumber
      ? {
          href: `https://wa.me/${restaurant.whatsappNumber.replace(/\D/g, "")}`,
          label: "WhatsApp",
          display: restaurant.whatsappNumber,
          icon: IconBrandWhatsapp,
          iconClass: "text-emerald-600",
          bgClass: "bg-emerald-500/10",
        }
      : null,
    restaurant.instagramUrl
      ? {
          href: restaurant.instagramUrl,
          label: "Instagram",
          display: "Follow us",
          icon: IconBrandInstagram,
          iconClass: "text-pink-600",
          bgClass: "bg-pink-500/10",
        }
      : null,
    restaurant.twitterUrl
      ? {
          href: restaurant.twitterUrl,
          label: "X / Twitter",
          display: "Follow us",
          icon: IconBrandTwitter,
          iconClass: "text-sky-600",
          bgClass: "bg-sky-500/10",
        }
      : null,
    restaurant.facebookUrl
      ? {
          href: restaurant.facebookUrl,
          label: "Facebook",
          display: "Like our page",
          icon: IconBrandFacebook,
          iconClass: "text-blue-600",
          bgClass: "bg-blue-500/10",
        }
      : null,
    restaurant.tiktokUrl
      ? {
          href: restaurant.tiktokUrl,
          label: "TikTok",
          display: "Watch us",
          icon: IconBrandTiktok,
          iconClass: "text-foreground",
          bgClass: "bg-muted",
        }
      : null,
    restaurant.websiteUrl
      ? {
          href: restaurant.websiteUrl,
          label: "Website",
          display: "Visit website",
          icon: IconWorld,
          iconClass: "text-muted-foreground",
          bgClass: "bg-muted",
        }
      : null,
  ].filter(Boolean) as SocialLink[];

  const hasAny =
    restaurant.address ||
    restaurant.phone ||
    socials.length > 0;

  if (!hasAny) return null;

  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Contact
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Find us</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {restaurant.address && (
            <ContactCard
              href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
              label="Address"
              display={restaurant.address}
              icon={IconMapPin}
              iconClass="text-primary"
              bgClass="bg-primary/10"
            />
          )}
          {restaurant.phone && (
            <ContactCard
              href={`tel:${restaurant.phone}`}
              label="Phone"
              display={restaurant.phone}
              icon={IconPhone}
              iconClass="text-primary"
              bgClass="bg-primary/10"
            />
          )}
          {socials.map((s) => (
            <ContactCard key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCard({
  href,
  label,
  display,
  icon: Icon,
  iconClass,
  bgClass,
}: {
  href: string;
  label: string;
  display: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? "_self" : "_blank"}
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-sm"
    >
      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
        <Icon className={`size-4 ${iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium group-hover:underline">{display}</p>
      </div>
    </a>
  );
}
