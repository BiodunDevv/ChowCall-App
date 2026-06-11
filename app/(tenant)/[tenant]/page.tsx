"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
	IconMessageCircle,
	IconPhoneCall,
	IconToolsKitchen2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import { publicOrderingApi } from "@/lib/public-ordering";

function titleFromSlug(slug: string) {
	return slug
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export default function TenantLandingPage() {
	const params = useParams<{ tenant: string }>();
	const tenantSlug = params?.tenant ?? "";
	const rootOrigin = getRootOrigin();

	const tenant = useQuery({
		queryKey: ["public-tenant", tenantSlug],
		queryFn: () => publicOrderingApi.tenant(tenantSlug),
		retry: false,
		enabled: Boolean(tenantSlug),
	});

	if (tenant.isLoading) return <LogoLoadingScreen />;

	if (tenant.isError || !tenant.data?.data) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
				<div className="pointer-events-none absolute inset-0 opacity-30">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
				<div className="relative z-10">
					<h1 className="text-4xl font-bold">Restaurant not found</h1>
					<p className="mt-3 text-muted-foreground">
						This restaurant is not active on ChowCall yet.
					</p>
					<Button asChild className="mt-6">
						<a href={rootOrigin}>Go to ChowCall</a>
					</Button>
				</div>
			</main>
		);
	}

	const restaurant = tenant.data.data;
	const restaurantName = restaurant.name || titleFromSlug(tenantSlug);
	const orderHref = getPublicTenantPath(tenantSlug, "order");
	const menuHref = getPublicTenantPath(tenantSlug, "menu");
	const callHref = restaurant.phone ? `tel:${restaurant.phone}` : orderHref;

	return (
		<main className="relative min-h-screen overflow-hidden bg-background">
			<div className="pointer-events-none absolute inset-0 opacity-30">
				<FloatingPaths position={1} />
				<FloatingPaths position={-1} />
			</div>
			<header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
				<a href={rootOrigin} className="inline-flex items-center gap-2">
					<Image alt="ChowCall" src="/chowcall-logo.svg" width={34} height={34} />
					<span className="font-semibold tracking-tight">ChowCall</span>
				</a>
			</header>

			<section className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_.95fr]">
				<div>
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
						<IconMessageCircle className="size-4 text-primary" />
						AI ordering for {restaurantName}
					</div>
					<h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
						Order from {restaurantName} with ChowCall AI.
					</h1>
					<p className="mt-5 max-w-2xl text-lg text-muted-foreground">
						Call or chat with the restaurant&apos;s AI assistant to place your
						food order, confirm pickup or delivery, and get a payment link when
						everything looks right.
					</p>
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

				<div className="rounded-2xl border bg-card p-5 shadow-sm">
					<div className="flex items-center gap-3 border-b pb-4">
						{restaurant.logo ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={restaurant.logo} alt={restaurantName} className="size-12 rounded-xl object-cover" />
						) : (
							<Image alt="ChowCall" src="/chowcall-logo.svg" width={48} height={48} />
						)}
						<div>
							<h2 className="font-semibold">{restaurantName}</h2>
							<p className="text-sm text-muted-foreground">
								{restaurant.address ?? "Pickup and delivery ordering"}
							</p>
						</div>
					</div>
					<div className="space-y-4 pt-5">
						<div className="rounded-xl bg-muted p-4">
							<p className="text-sm font-medium">AI assistant</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{restaurant.aiGreeting ??
									`Hi, welcome to ${restaurantName}. Are you ordering for pickup or delivery today?`}
							</p>
						</div>
						<div className="grid gap-3 text-sm sm:grid-cols-2">
							<div className="rounded-xl border p-4">
								<p className="font-medium">Pickup</p>
								<p className="mt-1 text-muted-foreground">Confirm your food and collect when ready.</p>
							</div>
							<div className="rounded-xl border p-4">
								<p className="font-medium">Delivery</p>
								<p className="mt-1 text-muted-foreground">Add your address and get delivery pricing.</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
