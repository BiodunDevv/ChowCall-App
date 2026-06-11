"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { useAuthStore } from "@/stores/auth-store";
import { getPostAuthPath, getTenantScopedPath, isSuperAdmin } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import {
	IconPhone,
	IconArrowRight,
	IconLock,
	IconLayoutDashboard,
	IconAlertTriangle,
	IconArrowUpRight,
} from "@tabler/icons-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type TenantInfo = {
	_id: string;
	name: string;
	slug: string;
	logo?: string;
	subscriptionStatus: string;
};

export default function TenantLandingPage() {
	const params = useParams<{ tenant: string }>();
	const tenantSlug = params?.tenant ?? "";

	const [tenantData, setTenantData] = useState<TenantInfo | null | undefined>(undefined); // undefined = loading
	const user = useAuthStore((state) => state.user);
	const rootOrigin = getRootOrigin();
	const rootSignin = `${rootOrigin}/auth/signin`;

	useEffect(() => {
		fetch(`${API_URL}/v1/tenants/by-slug/${tenantSlug}`, { cache: "no-store" })
			.then((r) => (r.ok ? r.json() : null))
			.then((json) => setTenantData(json?.data ?? null))
			.catch(() => setTenantData(null));
	}, [tenantSlug]);

	if (tenantData === undefined) return <LogoLoadingScreen />;

	const tenantName =
		tenantData?.name ??
		tenantSlug
			.split("-")
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join(" ");

	// ── Tenant not found ────────────────────────────────────────────────────────
	if (!tenantData) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
				<div className="pointer-events-none absolute inset-0 opacity-30">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
				<div className="relative z-10">
					<h1 className="text-4xl font-bold">Restaurant not found</h1>
					<p className="mt-3 text-muted-foreground">
						This restaurant doesn&apos;t exist on ChowCall.
					</p>
					<Button asChild className="mt-6">
						<a href={rootOrigin}>Go to ChowCall</a>
					</Button>
				</div>
			</main>
		);
	}

	// ── Wrong-subdomain: signed-in user belongs to a different tenant ──────────
	const userTenantSlug = user?.tenantSlug ?? user?.tenant?.slug;
	const isOnWrongSubdomain =
		user &&
		!isSuperAdmin(user) &&
		userTenantSlug &&
		userTenantSlug !== tenantSlug;

	if (isOnWrongSubdomain) {
		const correctHref = getTenantScopedPath(userTenantSlug!, "/dashboard");
		const correctName = user.tenant?.name ?? userTenantSlug;

		return (
			<main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
				<div className="pointer-events-none absolute inset-0 opacity-30">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>

				<header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
					<a
						href={rootOrigin}
						className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:opacity-80 transition-opacity"
					>
						<Image
							alt="ChowCall"
							src="/chowcall-logo.svg"
							width={32}
							height={32}
							className="h-8 w-8 object-contain"
						/>
						<span className="text-base font-semibold tracking-tight">ChowCall</span>
					</a>
				</header>

				<div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
					<div className="mb-6 flex size-16 items-center justify-center rounded-full border bg-card shadow-sm">
						<IconAlertTriangle className="size-8 text-amber-500" />
					</div>
					<h1 className="text-3xl font-bold tracking-tight">
						Wrong workspace
					</h1>
					<p className="mx-auto mt-3 max-w-md text-muted-foreground">
						You&apos;re signed in to{" "}
						<span className="font-semibold text-foreground">{correctName}</span>,
						not <span className="font-semibold text-foreground">{tenantName}</span>.
					</p>
					<p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
						You can&apos;t access another restaurant&apos;s workspace. Let&apos;s take you
						where you belong.
					</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						<Button asChild size="lg" className="gap-2">
							<a href={correctHref}>
								<IconLayoutDashboard className="size-4" />
								Go to my dashboard
							</a>
						</Button>
						<Button asChild size="lg" variant="outline" className="gap-2">
							<a href={rootSignin}>
								Sign in as someone else
								<IconArrowUpRight className="size-4" />
							</a>
						</Button>
					</div>
				</div>

				<footer className="relative z-10 flex items-center justify-center gap-2 border-t py-5 text-sm text-muted-foreground">
					<span>Powered by</span>
					<a
						href={rootOrigin}
						className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors"
					>
						<Image
							alt="ChowCall"
							src="/chowcall-logo.svg"
							width={18}
							height={18}
							className="h-4.5 w-4.5 object-contain"
						/>
						ChowCall
					</a>
				</footer>
			</main>
		);
	}

	// ── Correct tenant signed in — show Go to Dashboard ───────────────────────
	const isOwnTenant = user && !isSuperAdmin(user) && userTenantSlug === tenantSlug;
	const dashboardHref = isOwnTenant
		? getTenantScopedPath(tenantSlug, "/dashboard")
		: null;

	// ── Tenant not active — access restricted gate ─────────────────────────────
	if (tenantData.subscriptionStatus !== "active") {
		return (
			<main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
				<div className="pointer-events-none absolute inset-0 opacity-40">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>

				<header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
					<a
						href={rootOrigin}
						className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:opacity-80 transition-opacity"
						aria-label="ChowCall home"
					>
						{tenantData.logo ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={tenantData.logo} alt={tenantName} className="h-9 w-9 rounded-md object-cover" />
						) : (
							<Image alt="ChowCall" src="/chowcall-logo.svg" width={36} height={36} className="h-9 w-9 object-contain" />
						)}
						<span className="text-base font-semibold tracking-tight text-foreground">
							{tenantData.logo ? tenantName : "ChowCall"}
						</span>
					</a>
					{dashboardHref && (
						<Button asChild size="sm" className="gap-1.5">
							<a href={dashboardHref}>
								<IconLayoutDashboard className="size-3.5" />
								Dashboard
							</a>
						</Button>
					)}
				</header>

				<div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
					<div className="mb-6 flex size-16 items-center justify-center rounded-full border bg-card shadow-sm">
						<IconLock className="size-8 text-muted-foreground" />
					</div>
					<h1 className="text-4xl font-bold tracking-tight text-primary">{tenantName}</h1>
					<p className="mx-auto mt-4 max-w-md text-lg font-medium text-foreground">
						This restaurant hasn&apos;t activated their ChowCall account yet.
					</p>
					<p className="mx-auto mt-2 max-w-sm text-muted-foreground">
						If you&apos;re the owner, sign in to complete setup and choose a plan.
					</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						{dashboardHref ? (
							<Button asChild size="lg" className="gap-2">
								<a href={dashboardHref}>
									<IconLayoutDashboard className="size-4" />
									Go to dashboard
								</a>
							</Button>
						) : (
							<Button asChild size="lg">
								<a href={rootSignin}>Sign in as staff</a>
							</Button>
						)}
						<Button asChild size="lg" variant="outline" className="gap-2">
							<a href={rootOrigin}>
								Learn about ChowCall
								<IconArrowRight className="size-4" />
							</a>
						</Button>
					</div>
				</div>

				<footer className="relative z-10 flex items-center justify-center gap-2 border-t py-5 text-sm text-muted-foreground">
					<span>Powered by</span>
					<a href={rootOrigin} className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors">
						<Image alt="ChowCall" src="/chowcall-logo.svg" width={18} height={18} className="h-4.5 w-4.5 object-contain" />
						ChowCall
					</a>
				</footer>
			</main>
		);
	}

	// ── Active tenant — coming soon page ──────────────────────────────────────
	return (
		<main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
			<div className="pointer-events-none absolute inset-0 opacity-40">
				<FloatingPaths position={1} />
				<FloatingPaths position={-1} />
			</div>

			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-10"
			>
				<div className="absolute left-1/2 top-0 h-125 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,--theme(--color-primary/.12),transparent_70%)]" />
			</div>

			<header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
				<a
					href={rootOrigin}
					aria-label="ChowCall home"
					className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:opacity-80 transition-opacity"
				>
					{tenantData.logo ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={tenantData.logo} alt={tenantName} className="h-9 w-9 rounded-md object-cover" />
					) : (
						<Image alt="ChowCall" src="/chowcall-logo.svg" width={36} height={36} className="h-9 w-9 object-contain" />
					)}
					<span className="text-base font-semibold tracking-tight text-foreground">
						{tenantData.logo ? tenantName : "ChowCall"}
					</span>
				</a>
				{dashboardHref ? (
					<Button asChild size="sm" className="gap-1.5">
						<a href={dashboardHref}>
							<IconLayoutDashboard className="size-3.5" />
							Dashboard
						</a>
					</Button>
				) : (
					<Button asChild size="sm" variant="outline">
						<a href={rootSignin}>Staff sign in</a>
					</Button>
				)}
			</header>

			<div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
				<div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
					<span className="relative flex size-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
						<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
					</span>
					Setting up {tenantName}
				</div>

				<h1 className="mx-auto max-w-2xl text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
					{tenantName}
				</h1>

				<p className="mx-auto mt-5 max-w-md text-balance text-lg text-muted-foreground">
					We&apos;re getting everything ready. You&apos;ll be able to order
					right from this page very soon.
				</p>

				<div className="mt-8 flex items-center gap-3">
					<div className="h-px w-12 bg-border" />
					<span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
						Coming soon
					</span>
					<div className="h-px w-12 bg-border" />
				</div>

				<div className="mt-10 flex flex-wrap items-center justify-center gap-3">
					{dashboardHref ? (
						<Button asChild size="lg" className="gap-2">
							<a href={dashboardHref}>
								<IconLayoutDashboard className="size-4" />
								Go to dashboard
							</a>
						</Button>
					) : (
						<Button asChild size="lg" className="gap-2">
							<a href={rootSignin}>
								<IconPhone className="size-4" />
								Staff portal
							</a>
						</Button>
					)}
					<Button asChild size="lg" variant="outline" className="gap-2">
						<a href={rootOrigin}>
							Learn about ChowCall
							<IconArrowRight className="size-4" />
						</a>
					</Button>
				</div>
			</div>

			<footer className="relative z-10 flex items-center justify-center gap-2 border-t py-5 text-sm text-muted-foreground">
				<span>Powered by</span>
				<a href={rootOrigin} className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors">
					<Image alt="ChowCall" src="/chowcall-logo.svg" width={18} height={18} className="h-4.5 w-4.5 object-contain" />
					ChowCall
				</a>
			</footer>
		</main>
	);
}
