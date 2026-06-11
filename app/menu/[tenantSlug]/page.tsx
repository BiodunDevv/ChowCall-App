"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { formatMoney, publicOrderingApi } from "@/lib/public-ordering";

export default function PublicMenuPage() {
	const params = useParams<{ tenantSlug: string }>();
	const tenantSlug = params?.tenantSlug ?? "";
	const menu = useQuery({
		queryKey: ["public-menu", tenantSlug],
		queryFn: () => publicOrderingApi.menu(tenantSlug),
		retry: false,
		enabled: Boolean(tenantSlug),
	});

	const grouped = useMemo(() => {
		const groups = new Map<string, NonNullable<typeof menu.data>["data"]>();
		for (const item of menu.data?.data ?? []) {
			const category = item.category || "Menu";
			groups.set(category, [...(groups.get(category) ?? []), item]);
		}
		return Array.from(groups.entries());
	}, [menu.data]);

	if (menu.isLoading) return <LogoLoadingScreen />;

	if (menu.isError || !menu.data?.tenant) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
				<div>
					<h1 className="text-3xl font-bold">Menu not available</h1>
					<p className="mt-2 text-muted-foreground">This restaurant menu is not active on ChowCall yet.</p>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-background">
			<section className="border-b px-6 py-12">
				<div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-medium text-primary">Menu preview</p>
						<h1 className="mt-2 text-4xl font-bold tracking-tight">{menu.data.tenant.name}</h1>
						<p className="mt-2 max-w-xl text-muted-foreground">
							Browse the menu, then let ChowCall AI help place the order clearly.
						</p>
					</div>
					<Button asChild size="lg">
						<a href={getPublicTenantPath(tenantSlug, "order")}>Order with AI</a>
					</Button>
				</div>
			</section>

			<section className="mx-auto max-w-6xl space-y-8 px-6 py-10">
				{grouped.map(([category, items]) => (
					<div key={category}>
						<h2 className="mb-4 text-xl font-semibold">{category}</h2>
						<div className="grid gap-3 md:grid-cols-2">
							{items.map((item) => (
								<article key={item._id ?? item.name} className="rounded-xl border bg-card p-4">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h3 className="font-semibold">{item.name}</h3>
											{item.description ? (
												<p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
											) : null}
										</div>
										<p className="shrink-0 font-semibold">{formatMoney(item.basePrice)}</p>
									</div>
									<div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
										{item.available ? (
											<IconCircleCheck className="size-4 text-primary" />
										) : (
											<IconCircleX className="size-4 text-destructive" />
										)}
										{item.available ? "Available" : "Sold out"}
									</div>
									{item.addons?.length ? (
										<p className="mt-3 text-xs text-muted-foreground">
											Add-ons: {item.addons.map((addon) => addon.name).join(", ")}
										</p>
									) : null}
								</article>
							))}
						</div>
					</div>
				))}
			</section>
		</main>
	);
}
