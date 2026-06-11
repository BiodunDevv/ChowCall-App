"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { IconMinus, IconPlus, IconSend } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import {
	formatMoney,
	publicOrderingApi,
	type PublicMenuItem,
	type PublicOrderItem,
} from "@/lib/public-ordering";

type CartLine = PublicOrderItem & { id: string };

function toOrderItem(item: PublicMenuItem): CartLine {
	return {
		id: item._id ?? item.id ?? item.name,
		menuItemId: item._id ?? item.id,
		name: item.name,
		quantity: 1,
		unitPrice: item.basePrice,
	};
}

export default function PublicAiOrderPage() {
	const params = useParams<{ tenantSlug: string }>();
	const tenantSlug = params?.tenantSlug ?? "";
	const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery">("pickup");
	const [cart, setCart] = useState<CartLine[]>([]);
	const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", landmark: "" });
	const [message, setMessage] = useState("");
	const [chat, setChat] = useState<string[]>([]);

	const menu = useQuery({
		queryKey: ["public-order-menu", tenantSlug],
		queryFn: () => publicOrderingApi.menu(tenantSlug),
		retry: false,
		enabled: Boolean(tenantSlug),
	});

	const quotePayload = useMemo(
		() => ({
			fulfilmentType,
			distanceKm: fulfilmentType === "delivery" ? 5 : 0,
			items: cart,
			customer,
		}),
		[cart, customer, fulfilmentType],
	);

	const quote = useQuery({
		queryKey: ["public-order-quote", tenantSlug, quotePayload],
		queryFn: () => publicOrderingApi.quote(tenantSlug, quotePayload),
		enabled: cart.length > 0,
		retry: false,
	});

	const checkout = useMutation({
		mutationFn: () => publicOrderingApi.checkout(tenantSlug, quotePayload),
		onSuccess: (response) => {
			const url = response.data.authorizationUrl;
			if (url) window.location.href = url;
		},
	});

	if (menu.isLoading) return <LogoLoadingScreen />;

	if (menu.isError || !menu.data?.tenant) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
				<div>
					<h1 className="text-3xl font-bold">Ordering is not available</h1>
					<p className="mt-2 text-muted-foreground">This restaurant is not ready for AI ordering yet.</p>
				</div>
			</main>
		);
	}

	const restaurant = menu.data.tenant;
	const pricing = quote.data?.data.pricing;

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1fr_380px]">
				<section className="rounded-2xl border bg-card">
					<div className="border-b p-5">
						<p className="text-sm text-primary">AI chat ordering</p>
						<h1 className="text-2xl font-bold">{restaurant.name}</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{restaurant.aiGreeting ?? `Hi, welcome to ${restaurant.name}. Are you ordering for pickup or delivery today?`}
						</p>
					</div>
					<div className="grid gap-5 p-5 lg:grid-cols-[.9fr_1.1fr]">
						<div className="space-y-3">
							<div className="flex rounded-lg border p-1">
								{(["pickup", "delivery"] as const).map((type) => (
									<button
										key={type}
										className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${fulfilmentType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
										onClick={() => setFulfilmentType(type)}
										type="button"
									>
										{type === "pickup" ? "Pickup" : "Delivery"}
									</button>
								))}
							</div>
							<div className="h-[420px] overflow-y-auto rounded-xl border bg-background p-4">
								<div className="mb-3 max-w-[85%] rounded-2xl bg-muted p-3 text-sm">
									{restaurant.aiGreeting ?? `Hi, welcome to ${restaurant.name}. What would you like to order?`}
								</div>
								{chat.map((line, index) => (
									<div key={`${line}-${index}`} className="mb-3 ml-auto max-w-[85%] rounded-2xl bg-primary p-3 text-sm text-primary-foreground">
										{line}
									</div>
								))}
								{cart.length ? (
									<div className="rounded-2xl border bg-card p-3 text-sm">
										I have {cart.length} item{cart.length === 1 ? "" : "s"} in your order. I&apos;ll calculate the total before payment.
									</div>
								) : null}
							</div>
							<form
								className="flex gap-2"
								onSubmit={(event) => {
									event.preventDefault();
									if (!message.trim()) return;
									setChat((current) => [...current, message.trim()]);
									setMessage("");
								}}
							>
								<Input placeholder="Tell the AI what you want to order" value={message} onChange={(event) => setMessage(event.target.value)} />
								<Button type="submit" size="icon">
									<IconSend className="size-4" />
								</Button>
							</form>
						</div>

						<div className="space-y-4">
							<div>
								<h2 className="mb-3 font-semibold">Menu</h2>
								<div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
									{menu.data.data.map((item) => (
										<div key={item._id ?? item.name} className="flex items-center justify-between gap-3 rounded-xl border p-3">
											<div>
												<p className="text-sm font-medium">{item.name}</p>
												<p className="text-xs text-muted-foreground">{formatMoney(item.basePrice)}</p>
											</div>
											<Button
												disabled={!item.available}
												size="sm"
												variant="outline"
												onClick={() => setCart((current) => [...current, toOrderItem(item)])}
											>
												Add
											</Button>
										</div>
									))}
								</div>
							</div>
							<div className="grid gap-2 sm:grid-cols-2">
								<Input placeholder="Name" value={customer.name} onChange={(event) => setCustomer((c) => ({ ...c, name: event.target.value }))} />
								<Input placeholder="Phone" value={customer.phone} onChange={(event) => setCustomer((c) => ({ ...c, phone: event.target.value }))} />
								<Input placeholder="Email for payment" className="sm:col-span-2" value={customer.email} onChange={(event) => setCustomer((c) => ({ ...c, email: event.target.value }))} />
								{fulfilmentType === "delivery" ? (
									<>
										<Input placeholder="Delivery address" className="sm:col-span-2" value={customer.address} onChange={(event) => setCustomer((c) => ({ ...c, address: event.target.value }))} />
										<Input placeholder="Landmark" className="sm:col-span-2" value={customer.landmark} onChange={(event) => setCustomer((c) => ({ ...c, landmark: event.target.value }))} />
									</>
								) : null}
							</div>
						</div>
					</div>
				</section>

				<aside className="h-fit rounded-2xl border bg-card p-5">
					<h2 className="font-semibold">Order summary</h2>
					<div className="mt-4 space-y-3">
						{cart.length ? cart.map((item, index) => (
							<div key={`${item.id}-${index}`} className="flex items-center justify-between gap-3 text-sm">
								<div>
									<p className="font-medium">{item.name}</p>
									<p className="text-muted-foreground">{formatMoney(item.unitPrice)}</p>
								</div>
								<div className="flex items-center gap-2">
									<Button size="icon" variant="outline" className="size-7" onClick={() => setCart((current) => current.filter((_, i) => i !== index))}>
										<IconMinus className="size-3" />
									</Button>
									<span>{item.quantity}</span>
									<Button size="icon" variant="outline" className="size-7" onClick={() => setCart((current) => current.map((line, i) => i === index ? { ...line, quantity: line.quantity + 1 } : line))}>
										<IconPlus className="size-3" />
									</Button>
								</div>
							</div>
						)) : (
							<p className="text-sm text-muted-foreground">Add menu items to start an AI-assisted order.</p>
						)}
					</div>
					<div className="mt-5 space-y-2 border-t pt-4 text-sm">
						<div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(pricing?.itemSubtotal ?? 0)}</span></div>
						<div className="flex justify-between"><span>Delivery</span><span>{formatMoney(pricing?.deliveryFee ?? 0)}</span></div>
						<div className="flex justify-between"><span>Service fee</span><span>{formatMoney(pricing?.serviceFee ?? 0)}</span></div>
						<div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatMoney(pricing?.totalPayable ?? 0)}</span></div>
					</div>
					<Button className="mt-5 w-full" disabled={!cart.length || checkout.isPending} onClick={() => checkout.mutate()}>
						{checkout.isPending ? "Creating payment..." : "Confirm and get payment link"}
					</Button>
				</aside>
			</div>
		</main>
	);
}
