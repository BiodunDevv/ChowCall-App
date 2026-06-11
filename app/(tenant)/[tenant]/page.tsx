"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
	IconClock,
	IconMapPin,
	IconMessageCircle,
	IconPhoneCall,
	IconReceipt,
	IconToolsKitchen2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import {
	formatMoney,
	publicOrderingApi,
	type PublicMenuItem,
} from "@/lib/public-ordering";

function titleFromSlug(slug: string) {
	return slug
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function whatsappHref(phone?: string | null) {
	if (!phone) return null;
	const normalized = phone.replace(/[^\d+]/g, "");
	return `https://wa.me/${normalized.replace(/^\+/, "")}`;
}

function popularItems(items: PublicMenuItem[], enabled?: boolean | null) {
	if (enabled === false) return [];
	return items.filter((item) => item.available).slice(0, 4);
}

export default function TenantLandingPage() {
	const params = useParams<{ tenant: string }>();
	const tenantSlug = params?.tenant ?? "";
	const rootOrigin = getRootOrigin();

	const menu = useQuery({
		queryKey: ["public-tenant-menu", tenantSlug],
		queryFn: () => publicOrderingApi.menu(tenantSlug),
		retry: false,
		enabled: Boolean(tenantSlug),
	});

	if (menu.isLoading) return <LogoLoadingScreen />;

	if (menu.isError || !menu.data?.tenant) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
				<section className="max-w-md">
					<Image
						alt="ChowCall"
						className="mx-auto mb-5"
						src="/chowcall-logo.svg"
						width={52}
						height={52}
					/>
					<h1 className="text-3xl font-semibold tracking-tight">
						Restaurant not found
					</h1>
					<p className="mt-3 text-sm leading-6 text-muted-foreground">
						This restaurant is not active on ChowCall yet. Check the link or
						return to ChowCall.
					</p>
					<Button asChild className="mt-6">
						<a href={rootOrigin}>Go to ChowCall</a>
					</Button>
				</section>
			</main>
		);
	}

	const restaurant = menu.data.tenant;
	const items = menu.data.data;
	const restaurantName = restaurant.name || titleFromSlug(tenantSlug);
	const orderHref = getPublicTenantPath(tenantSlug, "order");
	const menuHref = getPublicTenantPath(tenantSlug, "menu");
	const callHref = restaurant.phone ? `tel:${restaurant.phone}` : orderHref;
	const whatsapp = whatsappHref(restaurant.whatsappNumber);
	const previewItems = popularItems(items, restaurant.showPopularItems);
	const canPickup = restaurant.pickupEnabled !== false;
	const canDeliver = restaurant.deliveryEnabled !== false;
	const activeOptions = [
		canPickup ? "Pickup" : null,
		canDeliver ? "Delivery" : null,
	].filter(Boolean);

	const coverStyle = restaurant.coverImageUrl
		? { backgroundImage: `url(${restaurant.coverImageUrl})` }
		: undefined;

	const assistantMessage =
		restaurant.aiAgent?.instructions ||
		restaurant.aiGreeting ||
		`Hi, welcome to ${restaurantName}. Are you ordering for pickup or delivery today?`;

	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="border-b bg-background">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
					<a href={rootOrigin} className="inline-flex items-center gap-2">
						<Image alt="ChowCall" src="/chowcall-logo.svg" width={32} height={32} />
						<span className="font-semibold tracking-tight">ChowCall</span>
					</a>
					<nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
						<a className="transition-colors hover:text-foreground" href={menuHref}>
							View Menu
						</a>
						<a className="transition-colors hover:text-foreground" href="#track">
							Track My Order
						</a>
						<a className="transition-colors hover:text-foreground" href="#contact">
							Contact
						</a>
					</nav>
				</div>
			</header>

			{restaurant.bannerEnabled && restaurant.bannerText ? (
				<div className="border-b bg-muted px-4 py-2 text-center text-sm">
					{restaurant.bannerText}
				</div>
			) : null}

			<section className="border-b">
				<div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
					<div className="flex flex-col justify-center">
						<div className="mb-5 flex items-center gap-3">
							{restaurant.logo ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									alt={restaurantName}
									className="size-14 rounded-lg border object-cover"
									src={restaurant.logo}
								/>
							) : (
								<div className="flex size-14 items-center justify-center rounded-lg border bg-muted">
									<IconToolsKitchen2 className="size-6 text-muted-foreground" />
								</div>
							)}
							<div>
								<p className="text-sm text-muted-foreground">
									{restaurant.category ?? "Restaurant AI ordering"}
								</p>
								<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
									{restaurantName}
								</h1>
							</div>
						</div>
						<p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
							{restaurant.description ??
								"Order by chat or phone. ChowCall helps confirm your food, pickup or delivery details, pricing, and payment before the kitchen starts."}
						</p>
						<div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
							{restaurant.address ? (
								<span className="inline-flex items-center gap-1.5">
									<IconMapPin className="size-4" />
									{restaurant.address}
								</span>
							) : null}
							{restaurant.estimatedPrepTime ? (
								<span className="inline-flex items-center gap-1.5">
									<IconClock className="size-4" />
									{restaurant.estimatedPrepTime} min average prep
								</span>
							) : null}
							{activeOptions.length ? <span>{activeOptions.join(" and ")}</span> : null}
						</div>
						<div className="mt-8 flex flex-wrap gap-3">
							<Button asChild size="lg" className="gap-2">
								<a href={orderHref}>
									<IconMessageCircle className="size-5" />
									Order Food with AI Chat
								</a>
							</Button>
							<Button asChild size="lg" variant="outline" className="gap-2">
								<a href={callHref}>
									<IconPhoneCall className="size-5" />
									Call to Order
								</a>
							</Button>
							<Button asChild size="lg" variant="ghost" className="gap-2">
								<a href={menuHref}>
									<IconToolsKitchen2 className="size-5" />
									View Menu
								</a>
							</Button>
						</div>
					</div>

					<div
						className="min-h-[360px] overflow-hidden rounded-lg border bg-card bg-cover bg-center"
						style={coverStyle}
					>
						<div className="flex h-full min-h-[360px] flex-col justify-between bg-background/88 p-5 backdrop-blur-[2px]">
							<div className="rounded-lg border bg-card p-4">
								<p className="text-sm font-medium">AI assistant</p>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									{assistantMessage}
								</p>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-lg border bg-card p-4">
									<p className="font-medium">1. Choose food</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Chat through your order or browse the menu.
									</p>
								</div>
								<div className="rounded-lg border bg-card p-4">
									<p className="font-medium">2. Confirm payment</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Get a total and pay before the kitchen ticket is sent.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{previewItems.length ? (
				<section className="border-b">
					<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
						<div className="mb-5 flex items-end justify-between gap-4">
							<div>
								<h2 className="text-2xl font-semibold tracking-tight">
									Popular menu
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									Available items customers can start with right now.
								</p>
							</div>
							<Button asChild variant="outline">
								<a href={menuHref}>View Menu</a>
							</Button>
						</div>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{previewItems.map((item) => (
								<article key={item._id ?? item.name} className="rounded-lg border bg-card p-4">
									<p className="text-sm text-muted-foreground">{item.category}</p>
									<h3 className="mt-2 font-semibold leading-snug">{item.name}</h3>
									{item.description ? (
										<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
											{item.description}
										</p>
									) : null}
									<div className="mt-4 flex items-center justify-between gap-3">
										<span className="font-semibold text-primary">
											{formatMoney(item.basePrice)}
										</span>
										<Button asChild size="sm" variant="outline">
											<a href={orderHref}>Order</a>
										</Button>
									</div>
								</article>
							))}
						</div>
					</div>
				</section>
			) : null}

			<section className="border-b">
				<div className="mx-auto grid max-w-6xl gap-3 px-4 py-10 sm:grid-cols-3 sm:px-6">
					{[
						{
							title: "AI-guided ordering",
							body: "The assistant gathers food, quantity, fulfilment, and contact details before checkout.",
						},
						{
							title: "Clear delivery pricing",
							body: "Delivery and service fees are calculated through the restaurant's ChowCall rules.",
						},
						{
							title: "Kitchen after payment",
							body: "Orders move to the restaurant only after payment or approved pay-on-delivery settings.",
						},
					].map((item) => (
						<div key={item.title} className="rounded-lg border bg-card p-5">
							<p className="font-medium">{item.title}</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
						</div>
					))}
				</div>
			</section>

			<section id="track" className="border-b">
				<div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[.9fr_1.1fr]">
					<div>
						<h2 className="text-2xl font-semibold tracking-tight">Track My Order</h2>
						<p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
							Already paid? Use the status link from your checkout confirmation to
							see payment and preparation updates for your order only.
						</p>
					</div>
					<div className="rounded-lg border bg-card p-5">
						<div className="flex items-start gap-3">
							<IconReceipt className="mt-0.5 size-5 text-primary" />
							<div>
								<p className="font-medium">Have an order link?</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Open the secure link sent after checkout. It shows your order
									reference, payment state, items, total, and fulfilment status.
								</p>
								<p className="mt-3 text-sm font-medium text-primary">
									Track My Order
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<footer id="contact" className="bg-card">
				<div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<div>
						<p className="font-medium text-foreground">{restaurantName}</p>
						<p>{restaurant.address ?? "Powered by ChowCall AI ordering"}</p>
					</div>
					<div className="flex flex-wrap gap-4">
						{restaurant.phone ? <a href={callHref}>Call to Order</a> : null}
						{whatsapp ? <a href={whatsapp}>WhatsApp</a> : null}
						{restaurant.instagramUrl ? <a href={restaurant.instagramUrl}>Instagram</a> : null}
						<a href={rootOrigin}>ChowCall</a>
					</div>
				</div>
			</footer>
		</main>
	);
}
