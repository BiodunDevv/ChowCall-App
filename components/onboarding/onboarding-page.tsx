"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChowCallLogo } from "@/components/chowcall-logo";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { AddressPicker, type AddressResult } from "@/components/ui/address-picker";
import {
	OpeningHoursPicker,
	scheduleToSummary,
	parseSavedSchedule,
	type WeeklySchedule,
} from "@/components/ui/opening-hours-picker";
import {
	ProfileStep,
	LogoStep,
	MenuStep,
	DeliveryStep,
	FeesStep,
	PaymentStep,
	NotificationsStep,
	EscalationStep,
} from "@/components/onboarding/step-fields";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { getTenantScopedPath } from "@/lib/auth";
import { useProtectedSession } from "@/hooks/use-protected-session";
import { logoutToRootSignin } from "@/lib/logout";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	IconLogout,
	IconArrowRight,
	IconCheck,
	IconAlertCircle,
} from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const steps = [
	["profile", "Restaurant profile", ["name", "phone"]],
	["logo", "Restaurant logo", ["logoUrl"]],
	["location", "Location & delivery origin", ["address"]],
	["hours", "Opening hours", ["summary"]],
	["menu", "Starter menu", ["firstItem"]],
	["delivery", "Delivery pricing", ["baseFee", "perKmRate"]],
	["fees", "Service fees", ["percentage"]],
	["payment", "Paystack connection", ["provider"]],
	["notifications", "Kitchen notifications", ["kitchenWhatsAppNumber"]],
	["escalation", "Escalation contact", ["contact"]],
] as const;

type StepKey = (typeof steps)[number][0];

// Steps where we allow skipping (no required fields enforced on "Save and continue")
const OPTIONAL_STEPS = new Set<StepKey>([
	"logo",
	"hours",
	"menu",
	"fees",
	"notifications",
	"escalation",
]);

// Required fields per step — if a step has required fields AND is not optional,
// the "Save and continue" button is disabled until they are filled.
const REQUIRED_FIELDS: Partial<Record<StepKey, string[]>> = {
	profile: ["name", "phone"],
	location: ["address"],
	delivery: ["baseFee", "perKmRate"],
	payment: ["provider"],
};

type TenantOnboarding = {
	completedSteps?: StepKey[];
	currentStep?: StepKey;
	status?: string;
	stepData?: Partial<Record<StepKey, Record<string, string>>>;
};

type TenantResponse = {
	data?: {
		name?: string;
		phone?: string;
		address?: string;
		logo?: string;
		mapPin?: { lat?: number; lng?: number };
		kitchenWhatsAppNumber?: string;
		deliveryPricing?: Record<string, unknown>;
		serviceFee?: Record<string, unknown>;
		payment?: Record<string, unknown>;
		voice?: Record<string, unknown>;
		openingHours?: Record<string, unknown>;
		onboarding?: TenantOnboarding;
	};
};

function getNextStepIndex(onboarding?: TenantOnboarding) {
	const completed = new Set(onboarding?.completedSteps ?? []);
	const firstIncomplete = steps.findIndex(([key]) => !completed.has(key));
	if (firstIncomplete >= 0) return firstIncomplete;
	if (onboarding?.status === "live") return steps.length;
	return steps.length;
}

function asString(value: unknown) {
	return typeof value === "string" ? value : "";
}

function mapTenantToForm(tenant: TenantResponse["data"]) {
	const stepData = tenant?.onboarding?.stepData ?? {};
	return {
		provider: asString(tenant?.payment?.provider) || "paystack",
		logoUrl: asString(stepData.logo?.logoUrl) || asString(tenant?.logo),
		name: asString(stepData.profile?.name) || asString(tenant?.name),
		phone: asString(stepData.profile?.phone) || asString(tenant?.phone),
		address: asString(stepData.location?.address) || asString(tenant?.address),
		summary:
			asString(stepData.hours?.summary) ||
			asString(tenant?.openingHours?.summary),
		firstItem: asString(stepData.menu?.firstItem),
		imageUrl: asString(stepData.menu?.imageUrl),
		baseFee:
			asString(stepData.delivery?.baseFee) ||
			(tenant?.deliveryPricing?.baseFee != null
				? String(tenant.deliveryPricing.baseFee)
				: ""),
		perKmRate:
			asString(stepData.delivery?.perKmRate) ||
			(tenant?.deliveryPricing?.perKmRate != null
				? String(tenant.deliveryPricing.perKmRate)
				: ""),
		percentage:
			asString(stepData.fees?.percentage) ||
			(tenant?.serviceFee?.percentage != null
				? String(tenant.serviceFee.percentage)
				: ""),
		kitchenWhatsAppNumber:
			asString(stepData.notifications?.kitchenWhatsAppNumber) ||
			asString(tenant?.kitchenWhatsAppNumber),
		contact: asString(stepData.escalation?.contact),
	};
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

/** Returns the validation error message for the current step, or null if valid. */
function getValidationError(
	stepKey: StepKey | undefined,
	data: Record<string, string>,
	mapPin: { lat: number; lng: number } | null,
	weeklySchedule: WeeklySchedule | undefined,
): string | null {
	if (!stepKey) return null;
	if (OPTIONAL_STEPS.has(stepKey)) return null;

	const required = REQUIRED_FIELDS[stepKey] ?? [];

	// Location step needs an address string AND valid coordinates
	if (stepKey === "location") {
		if (!data.address?.trim()) return "Please search and select your restaurant address.";
		if (!mapPin) return "Please select a location from the suggestions.";
		return null;
	}

	for (const field of required) {
		if (!data[field]?.trim()) {
			const labels: Record<string, string> = {
				name: "restaurant name",
				phone: "phone number",
				baseFee: "base delivery fee",
				perKmRate: "per-kilometre rate",
				provider: "payment provider",
			};
			return `Please enter your ${labels[field] ?? field} to continue.`;
		}
	}

	return null;
}

export function OnboardingPage() {
	useProtectedSession();
	const router = useRouter();
	const params = useParams<{ tenant?: string }>();
	const tenantSlug = params?.tenant;
	const user = useAuthStore((state) => state.user);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const { step, setStep } = useOnboardingStore();

	// Track which steps have been visited (so we only unlock those in sidebar)
	const [visitedMax, setVisitedMax] = useState(0);

	const logout = useMutation({
		mutationFn: () => logoutToRootSignin(clearAuth),
	});

	const [data, setData] = useState<Record<string, string>>({
		provider: "paystack",
	});
	const [mapPin, setMapPin] = useState<{ lat: number; lng: number } | null>(null);
	const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | undefined>(undefined);

	const onboarding = useQuery({
		queryKey: ["onboarding"],
		queryFn: () => api<TenantResponse>("/v1/onboarding"),
	});

	useEffect(() => {
		const tenant = onboarding.data?.data;
		if (!tenant) return;

		if (tenant.onboarding?.status === "live") {
			const slug = tenantSlug ?? user?.tenantSlug ?? user?.tenant?.slug;
			if (slug) router.replace(getTenantScopedPath(slug, "/dashboard"));
			return;
		}

		setData((current) => ({ ...current, ...mapTenantToForm(tenant) }));
		const nextIdx = getNextStepIndex(tenant.onboarding);
		setStep(nextIdx);
		setVisitedMax(nextIdx);

		if (tenant.mapPin?.lat && tenant.mapPin?.lng) {
			setMapPin({ lat: tenant.mapPin.lat, lng: tenant.mapPin.lng });
		}
		const savedSchedule = parseSavedSchedule(
			tenant.onboarding?.stepData?.hours?.schedule,
		);
		if (savedSchedule) setWeeklySchedule(savedSchedule);
	}, [onboarding.data, setStep, tenantSlug, user, router]);

	const current = steps[step];
	const currentStepKey = current?.[0];

	const currentStepData = useMemo(() => {
		if (!current) return {};
		const base = Object.fromEntries(
			current[2].map((field) => [field, data[field] ?? ""]),
		);
		if (currentStepKey === "logo") return { ...base, logoUrl: data.logoUrl ?? "" };
		if (currentStepKey === "location" && mapPin) return { ...base, mapPin };
		if (currentStepKey === "hours" && weeklySchedule) {
			return {
				...base,
				summary: scheduleToSummary(weeklySchedule),
				schedule: JSON.stringify(weeklySchedule),
			};
		}
		if (currentStepKey === "menu") return { ...base, imageUrl: data.imageUrl ?? "" };
		return base;
	}, [current, currentStepKey, data, mapPin, weeklySchedule]);

	const validationError = useMemo(
		() => getValidationError(currentStepKey, data, mapPin, weeklySchedule),
		[currentStepKey, data, mapPin, weeklySchedule],
	);

	const save = useMutation({
		mutationFn: () =>
			api<TenantResponse>("/v1/onboarding/steps", {
				method: "PATCH",
				body: JSON.stringify({ step: currentStepKey, data: currentStepData }),
			}),
		onSuccess: (response) => {
			const nextStep = getNextStepIndex(response.data?.onboarding);
			setStep(nextStep);
			setVisitedMax((prev) => Math.max(prev, nextStep));
			toast.success("Progress saved");
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Could not save this step.",
			);
		},
	});

	const goLive = useMutation({
		mutationFn: () =>
			api<TenantResponse>("/v1/onboarding/go-live", { method: "POST" }),
		onSuccess: () => {
			toast.success("Workspace is live! Choose a plan to get started.");
			const slug = tenantSlug ?? user?.tenantSlug ?? user?.tenant?.slug;
			if (slug) router.push(getTenantScopedPath(slug, "/billing/plan"));
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Could not complete onboarding.",
			);
		},
	});

	if (onboarding.isLoading) return <LogoLoadingScreen fixed={false} />;

	// ── Review / go-live screen ────────────────────────────────────────────────
	if (step === steps.length || !current) {
		return (
			<main className="relative min-h-screen px-5 py-16">
				<div className="absolute right-4 top-4">
					<ThemeToggler className="size-9" />
				</div>
				<div className="mx-auto max-w-2xl">
					<ChowCallLogo className="mb-10 font-semibold" />
					<h1 className="text-3xl font-semibold">
						Your workspace is ready for review.
					</h1>
					<p className="mt-3 text-muted-foreground">
						Review readiness checks, then connect your payment credentials and
						voice ordering settings.
					</p>
					<Button
						className="mt-6"
						disabled={goLive.isPending}
						onClick={() => goLive.mutate()}
					>
						{goLive.isPending ? "Running checks…" : "Run readiness and go live"}
					</Button>

					{user && (
						<div className="mt-16 flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
							<div className="flex min-w-0 items-center gap-3">
								<Avatar className="size-9 shrink-0">
									<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
										{getInitials(user.name)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-foreground">
										{user.name}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{user.email}
									</p>
								</div>
							</div>
							<Button
								className="shrink-0"
								disabled={logout.isPending}
								onClick={() => logout.mutate()}
								size="sm"
								variant="ghost"
							>
								<IconLogout className="size-4" />
								{logout.isPending ? "Signing out…" : "Sign out"}
							</Button>
						</div>
					)}
				</div>
			</main>
		);
	}

	// ── Main onboarding layout ─────────────────────────────────────────────────
	return (
		<main className="mx-auto grid min-h-screen max-w-5xl gap-10 px-5 py-10 md:grid-cols-[240px_1fr]">
			{/* Sidebar */}
			<aside className="flex flex-col">
				<div className="flex items-center justify-between gap-2">
					<ChowCallLogo className="font-semibold" />
					<ThemeToggler className="size-8 shrink-0" />
				</div>

				<ol className="mt-8 flex-1 space-y-1 text-sm">
					{steps.map((item, index) => {
						const isActive = index === step;
						const isCompleted = index < visitedMax;
						const isReachable = index <= visitedMax;
						const isOptional = OPTIONAL_STEPS.has(item[0]);

						return (
							<li key={item[0]}>
								<button
									type="button"
									disabled={!isReachable || save.isPending}
									onClick={() => {
										if (isReachable && !save.isPending) setStep(index);
									}}
									className={cn(
										"flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
										isActive
											? "bg-primary/8 font-semibold text-primary"
											: isCompleted
												? "text-foreground/80 hover:bg-muted hover:text-foreground"
												: isReachable
													? "text-muted-foreground hover:bg-muted hover:text-foreground"
													: "cursor-default text-muted-foreground/40",
									)}
								>
									{/* Step indicator dot */}
									<span
										className={cn(
											"flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
											isActive
												? "border-primary bg-primary text-primary-foreground"
												: isCompleted
													? "border-emerald-500 bg-emerald-500 text-white"
													: "border-current bg-transparent",
										)}
									>
										{isCompleted && !isActive ? (
											<IconCheck className="size-3" />
										) : (
											index + 1
										)}
									</span>

									<span className="flex-1 leading-tight">{item[1]}</span>

									{isOptional && !isActive && (
										<span className="shrink-0 text-[10px] font-normal text-muted-foreground/60">
											opt
										</span>
									)}
								</button>
							</li>
						);
					})}
				</ol>

				{/* Signed-in user + logout */}
				{user && (
					<div className="mt-8 rounded-xl border bg-card p-3">
						<div className="flex min-w-0 items-center gap-2.5">
							<Avatar className="size-8 shrink-0">
								<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="truncate text-xs font-semibold text-foreground">
									{user.name}
								</p>
								<p className="truncate text-[11px] text-muted-foreground">
									{user.email}
								</p>
							</div>
						</div>
						<Button
							className="mt-2.5 w-full text-destructive hover:text-destructive"
							disabled={logout.isPending}
							onClick={() => logout.mutate()}
							size="sm"
							variant="outline"
						>
							<IconLogout className="size-3.5" />
							{logout.isPending ? "Signing out…" : "Sign out"}
						</Button>
					</div>
				)}
			</aside>

			{/* Step content */}
			<section className="w-full py-10">
				<div className="w-full max-w-lg">
					<div className="flex items-center gap-2">
						<p className="text-sm text-muted-foreground">
							Step {step + 1} of {steps.length}
						</p>
						{currentStepKey && OPTIONAL_STEPS.has(currentStepKey) && (
							<span className="inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
								Optional
							</span>
						)}
					</div>
					<h1 className="mt-2 text-3xl font-semibold">{current[1]}</h1>
				</div>

				<div className="mt-8 w-full max-w-lg">
					{currentStepKey === "profile" && (
						<ProfileStep data={data} setData={setData} />
					)}
					{currentStepKey === "logo" && (
						<LogoStep data={data} setData={setData} />
					)}
					{currentStepKey === "location" && (
						<AddressPicker
							value={data.address ?? ""}
							placeholder="Search your restaurant address…"
							onChange={(result: AddressResult | null) => {
								setData((d) => ({ ...d, address: result?.address ?? "" }));
								setMapPin(result ? { lat: result.lat, lng: result.lng } : null);
							}}
						/>
					)}
					{currentStepKey === "hours" && (
						<OpeningHoursPicker
							value={weeklySchedule}
							onChange={setWeeklySchedule}
						/>
					)}
					{currentStepKey === "menu" && (
						<MenuStep data={data} setData={setData} />
					)}
					{currentStepKey === "delivery" && (
						<DeliveryStep data={data} setData={setData} />
					)}
					{currentStepKey === "fees" && (
						<FeesStep data={data} setData={setData} />
					)}
					{currentStepKey === "payment" && (
						<PaymentStep data={data} setData={setData} />
					)}
					{currentStepKey === "notifications" && (
						<NotificationsStep data={data} setData={setData} />
					)}
					{currentStepKey === "escalation" && (
						<EscalationStep data={data} setData={setData} />
					)}
				</div>

				{/* Validation hint */}
				{validationError && (
					<div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive max-w-lg">
						<IconAlertCircle className="mt-0.5 size-4 shrink-0" />
						{validationError}
					</div>
				)}

				{/* Action buttons */}
				<div className="mt-6 flex flex-col gap-3 max-w-lg">
					<div className="flex gap-3">
						<Button
							disabled={step === 0 || save.isPending}
							onClick={() => setStep(step - 1)}
							variant="outline"
						>
							Back
						</Button>
						<Button
							disabled={save.isPending || Boolean(validationError)}
							onClick={() => save.mutate()}
							title={validationError ?? undefined}
						>
							{save.isPending ? "Saving…" : "Save and continue"}
						</Button>
					</div>
					{currentStepKey && OPTIONAL_STEPS.has(currentStepKey) && (
						<button
							type="button"
							className="flex items-center gap-1 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
							onClick={() => {
								const next = step + 1;
								setStep(next);
								setVisitedMax((prev) => Math.max(prev, next));
							}}
						>
							Skip for now
							<IconArrowRight className="size-3" />
						</button>
					)}
				</div>
			</section>
		</main>
	);
}
