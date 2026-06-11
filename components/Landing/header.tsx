"use client";
import { ChowCallLogo } from "@/components/chowcall-logo";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/Landing/mobile-nav";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
import { useAuthStore } from "@/stores/auth-store";
import { authApi, getPostAuthPath } from "@/lib/auth";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const navLinks = [
	{
		label: "Features",
		href: "#features",
	},
	{
		label: "Pricing",
		href: "#pricing",
	},
	{
		label: "How it works",
		href: "#how-it-works",
	},
];

export function Header() {
	const scrolled = useScroll(10);
	const user = useAuthStore((state) => state.user);
	const setUser = useAuthStore((state) => state.setUser);

	const session = useQuery({
		queryKey: ["auth", "landing-header"],
		queryFn: authApi.me,
		enabled: Boolean(user),
		retry: false,
		staleTime: 60_000,
	});

	useEffect(() => {
		if (session.data?.user) setUser(session.data.user);
	}, [session.data?.user, setUser]);

	const activeUser = session.data?.user ?? user;
	const dashboardHref = activeUser ? getPostAuthPath(activeUser) : null;
	const firstName = activeUser?.name?.split(" ")[0] ?? "";

	return (
		<header
			className={cn(
				"sticky top-0 z-50 mx-auto w-full max-w-5xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
				{
					"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-4xl md:shadow":
						scrolled,
				}
			)}
		>
			<nav
				className={cn(
					"flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
					{
						"md:px-2": scrolled,
					}
				)}
			>
				<ChowCallLogo className="px-2" href="/" />
				<div className="hidden items-center gap-2 md:flex">
					<div>
						{navLinks.map((link) => (
							<Button asChild key={link.label} size="sm" variant="ghost">
								<a href={link.href}>{link.label}</a>
							</Button>
						))}
					</div>

					{activeUser && dashboardHref ? (
						<>
							<span className="text-sm text-muted-foreground">
								Hi, <span className="font-medium text-foreground">{firstName}</span>
							</span>
							<Button asChild size="sm" className="gap-1.5">
								<a href={dashboardHref}>
									<IconLayoutDashboard className="size-3.5" />
									Dashboard
								</a>
							</Button>
						</>
					) : (
						<>
							<Button asChild size="sm" variant="outline">
								<a href="/auth/signin">Sign In</a>
							</Button>
							<Button asChild size="sm">
								<a href="/auth/signup">Get Started</a>
							</Button>
						</>
					)}
					<ThemeToggler className="size-8" />
				</div>
				<div className="flex items-center gap-2 md:hidden">
					<ThemeToggler className="size-9" />
					<MobileNav />
				</div>
			</nav>
		</header>
	);
}
