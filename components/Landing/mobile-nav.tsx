import { cn } from "@/lib/utils";
import React from "react";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/components/Landing/header";
import { Portal, PortalBackdrop } from "@/components/Landing/portal";
import { IconX, IconMenu2, IconLayoutDashboard } from "@tabler/icons-react";
import { useAuthStore } from "@/stores/auth-store";
import { getPostAuthPath } from "@/lib/auth";

export function MobileNav() {
	const [open, setOpen] = React.useState(false);
	const closeMenu = () => setOpen(false);
	const user = useAuthStore((state) => state.user);
	const dashboardHref = user ? getPostAuthPath(user) : null;

	return (
		<div className="md:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label="Toggle menu"
				className="md:hidden"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
			>
				{open ? (
					<IconX className="size-4.5" />
				) : (
					<IconMenu2 className="size-4.5" />
				)}
			</Button>
			{open && (
				<Portal className="top-14" id="mobile-menu">
					<PortalBackdrop />
					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
							"size-full p-4"
						)}
						data-slot={open ? "open" : "closed"}
					>
						<div className="grid gap-y-2">
							{navLinks.map((link) => (
								<Button
									asChild
									className="justify-start"
									key={link.label}
									variant="ghost"
								>
									<a href={link.href} onClick={closeMenu}>
										{link.label}
									</a>
								</Button>
							))}
						</div>
						<div className="mt-12 flex flex-col gap-2">
							{user && dashboardHref ? (
								<Button asChild className="w-full gap-2">
									<a href={dashboardHref} onClick={closeMenu}>
										<IconLayoutDashboard className="size-4" />
										Go to Dashboard
									</a>
								</Button>
							) : (
								<>
									<Button asChild className="w-full" variant="outline">
										<a href="/auth/signin" onClick={closeMenu}>
											Sign In
										</a>
									</Button>
									<Button asChild className="w-full">
										<a href="/auth/signup" onClick={closeMenu}>
											Get Started
										</a>
									</Button>
								</>
							)}
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}
