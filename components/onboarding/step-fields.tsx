"use client";

/**
 * Purpose-built field UIs for each onboarding step.
 * Each component receives the shared `data` record + `setData` setter and
 * renders the appropriate controls — no generic placeholder inputs.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import {
	IconUser,
	IconPhone,
	IconCurrencyNaira,
	IconRoute,
	IconPercentage,
	IconBrandWhatsapp,
	IconHeadphones,
	IconDeviceMobile,
	IconCreditCard,
	IconToolsKitchen2,
} from "@tabler/icons-react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

type StepData = Record<string, string>;
type SetData = React.Dispatch<React.SetStateAction<StepData>>;

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
			<Label className="text-sm font-medium">{label}</Label>
			{children}
			{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
		</div>
	);
}

function IconInput({
	icon: Icon,
	...props
}: React.ComponentProps<"input"> & {
	icon: React.ComponentType<{ className?: string }>;
}) {
	return (
		<div className="relative">
			<Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input className="h-11 pl-9" {...props} />
		</div>
	);
}

// ─── Step 1: Profile ──────────────────────────────────────────────────────────

export function ProfileStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	return (
		<div className="space-y-4">
			<Field label="Restaurant name" hint="This is the public name customers will hear.">
				<IconInput
					icon={IconUser}
					placeholder="e.g. Mama's Kitchen"
					type="text"
					value={data.name ?? ""}
					onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
				/>
			</Field>
			<Field label="Phone number" hint="Used for routing and staff notifications.">
				<IconInput
					icon={IconPhone}
					placeholder="e.g. 08012345678"
					type="tel"
					value={data.phone ?? ""}
					onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
				/>
			</Field>
		</div>
	);
}

// ─── Step 2: Restaurant logo ──────────────────────────────────────────────────

export function LogoStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	const logoUrl = data.logoUrl ?? "";
	const restaurantName = data.name ?? "Your Restaurant";

	return (
		<div className="space-y-4">
			<Field
				label="Restaurant logo"
				hint="This logo will appear in the sidebar header for you and your team."
			>
				<ImageUploadField
					value={logoUrl}
					onChange={(url) => setData((d) => ({ ...d, logoUrl: url }))}
					aspect="video"
					fit="contain"
					placeholder="Click to upload or drag & drop"
					hint="PNG, JPG, WEBP up to 10 MB · or paste an image URL"
				/>
			</Field>

			{/* Live sidebar preview */}
			<div className="rounded-xl border bg-muted/30 p-4">
				<p className="mb-3 text-xs font-medium text-muted-foreground">Sidebar preview</p>
				<div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 w-fit">
					{logoUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={logoUrl}
							alt={restaurantName}
							className="h-8 w-8 rounded-md object-cover"
						/>
					) : (
						<div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border">
							{restaurantName.charAt(0).toUpperCase()}
						</div>
					)}
					<span className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[160px]">
						{restaurantName}
					</span>
				</div>
			</div>
		</div>
	);
}

// ─── Step 4: Starter menu ────────────────────────────────────────────────────

export function MenuStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	return (
		<div className="space-y-4">
			<Field
				label="First menu item name"
				hint="Just one item to get started — you can add more from the dashboard."
			>
				<IconInput
					icon={IconToolsKitchen2}
					placeholder="e.g. Jollof rice"
					type="text"
					value={data.firstItem ?? ""}
					onChange={(e) => setData((d) => ({ ...d, firstItem: e.target.value }))}
				/>
			</Field>

			<Field label="Item photo" hint="Clear photo helps customers know what to expect.">
				<ImageUploadField
					value={data.imageUrl ?? ""}
					onChange={(url) => setData((d) => ({ ...d, imageUrl: url }))}
					aspect="video"
					fit="cover"
					placeholder="Click to upload or drag & drop"
					hint="PNG, JPG, WEBP up to 10 MB · or paste an image URL"
				/>
			</Field>
		</div>
	);
}

// ─── Step 5: Delivery pricing ─────────────────────────────────────────────────

export function DeliveryStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	return (
		<div className="space-y-4">
			<Field
				label="Base delivery fee (₦)"
				hint="Fixed amount charged on every delivery regardless of distance."
			>
				<IconInput
					icon={IconCurrencyNaira}
					placeholder="e.g. 500"
					type="number"
					min="0"
					value={data.baseFee ?? ""}
					onChange={(e) => setData((d) => ({ ...d, baseFee: e.target.value }))}
				/>
			</Field>
			<Field
				label="Per-kilometre rate (₦/km)"
				hint="Added on top of the base fee, calculated from your restaurant to the customer."
			>
				<IconInput
					icon={IconRoute}
					placeholder="e.g. 100"
					type="number"
					min="0"
					value={data.perKmRate ?? ""}
					onChange={(e) => setData((d) => ({ ...d, perKmRate: e.target.value }))}
				/>
			</Field>

			{/* Live preview */}
			{data.baseFee && data.perKmRate && (
				<div className="rounded-xl border bg-muted/40 p-4 text-sm">
					<p className="font-medium text-foreground">Example fee estimate</p>
					<div className="mt-2 space-y-1 text-muted-foreground">
						{[1, 3, 5, 10].map((km) => {
							const fee =
								Number(data.baseFee) + km * Number(data.perKmRate);
							return (
								<div key={km} className="flex justify-between">
									<span>{km} km away</span>
									<span className="font-medium text-foreground">
										₦{fee.toLocaleString()}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Step 6: Service fees ─────────────────────────────────────────────────────

export function FeesStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	const pct = Number(data.percentage ?? 0);
	return (
		<div className="space-y-4">
			<Field
				label="Service fee percentage (%)"
				hint="Applied to the order subtotal before delivery. Set to 0 to disable."
			>
				<IconInput
					icon={IconPercentage}
					placeholder="e.g. 5"
					type="number"
					min="0"
					max="100"
					step="0.5"
					value={data.percentage ?? ""}
					onChange={(e) =>
						setData((d) => ({ ...d, percentage: e.target.value }))
					}
				/>
			</Field>

			{pct > 0 && (
				<div className="rounded-xl border bg-muted/40 p-4 text-sm">
					<p className="font-medium text-foreground">Example service fee</p>
					<div className="mt-2 space-y-1 text-muted-foreground">
						{[1000, 2500, 5000, 10000].map((order) => (
							<div key={order} className="flex justify-between">
								<span>₦{order.toLocaleString()} order</span>
								<span className="font-medium text-foreground">
									+₦{((order * pct) / 100).toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}{" "}
									fee
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Step 7: Paystack connection ──────────────────────────────────────────────

export function PaymentStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 rounded-xl border bg-card p-4">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#00c3f7]/10">
					<IconCreditCard className="size-5 text-[#00c3f7]" />
				</div>
				<div>
					<p className="text-sm font-semibold">Paystack</p>
					<p className="text-xs text-muted-foreground">
						ChowCall collects customer payments via Paystack. Your secret key
						is encrypted and never exposed to customers.
					</p>
				</div>
			</div>

			<Field
				label="Payment provider"
				hint="Currently only Paystack is supported."
			>
				<div className="relative">
					<IconCreditCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<select
						className="h-11 w-full appearance-none rounded-lg border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						value={data.provider ?? "paystack"}
						onChange={(e) =>
							setData((d) => ({ ...d, provider: e.target.value }))
						}
					>
						<option value="paystack">Paystack</option>
					</select>
				</div>
			</Field>
		</div>
	);
}

// ─── Step 8: Kitchen notifications ────────────────────────────────────────────

export function NotificationsStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 rounded-xl border bg-card p-4">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
					<IconBrandWhatsapp className="size-5 text-emerald-500" />
				</div>
				<div>
					<p className="text-sm font-semibold">WhatsApp kitchen tickets</p>
					<p className="text-xs text-muted-foreground">
						When a customer pays, ChowCall sends a structured order ticket to
						this number via WhatsApp.
					</p>
				</div>
			</div>
			<Field
				label="Kitchen WhatsApp number"
				hint="Include the country code, e.g. +2348012345678"
			>
				<IconInput
					icon={IconBrandWhatsapp}
					placeholder="+2348012345678"
					type="tel"
					value={data.kitchenWhatsAppNumber ?? ""}
					onChange={(e) =>
						setData((d) => ({
							...d,
							kitchenWhatsAppNumber: e.target.value,
						}))
					}
				/>
			</Field>
		</div>
	);
}

// ─── Step 9: Escalation contact ───────────────────────────────────────────────

export function EscalationStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 rounded-xl border bg-card p-4">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
					<IconHeadphones className="size-5 text-amber-500" />
				</div>
				<div>
					<p className="text-sm font-semibold">Live confirm escalation</p>
					<p className="text-xs text-muted-foreground">
						For custom orders, refunds, or out-of-range deliveries, ChowCall
						pings this contact for approval before proceeding.
					</p>
				</div>
			</div>
			<Field
				label="Escalation contact"
				hint="Phone number or WhatsApp number to ping for manager approval."
			>
				<IconInput
					icon={IconHeadphones}
					placeholder="+2348012345678"
					type="tel"
					value={data.contact ?? ""}
					onChange={(e) =>
						setData((d) => ({ ...d, contact: e.target.value }))
					}
				/>
			</Field>
		</div>
	);
}

// ─── Step 10: Restaurant phone routing ────────────────────────────────────────

export function PhoneStep({
	data,
	setData,
}: {
	data: StepData;
	setData: SetData;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 rounded-xl border bg-card p-4">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
					<IconDeviceMobile className="size-5 text-primary" />
				</div>
				<div>
					<p className="text-sm font-semibold">AI phone routing</p>
					<p className="text-xs text-muted-foreground">
						Calls to this number are answered by ChowCall&apos;s AI. It handles
						ordering, payment, and sends the kitchen a paid ticket.
					</p>
				</div>
			</div>
			<Field
				label="Routing number"
				hint="The phone number customers call to order — this is what you give to customers."
			>
				<IconInput
					icon={IconPhone}
					placeholder="e.g. 08012345678"
					type="tel"
					value={data.routingNumber ?? ""}
					onChange={(e) =>
						setData((d) => ({ ...d, routingNumber: e.target.value }))
					}
				/>
			</Field>
		</div>
	);
}
