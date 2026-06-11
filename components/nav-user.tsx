"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconUser, IconSettings, IconCreditCard, IconLogout, IconLoader } from "@tabler/icons-react";
import { useAuthStore } from "@/stores/auth-store";
import { authApi, isSuperAdmin } from "@/lib/auth";
import { logoutToRootSignin } from "@/lib/logout";
import { toast } from "sonner";

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function NavUser() {
	const storedUser = useAuthStore((state) => state.user);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const setUser = useAuthStore((state) => state.setUser);

	// Keep user fresh — re-fetch on mount, update store if changed
	const { data: meData } = useQuery({
		queryKey: ["auth-me"],
		queryFn: () => authApi.me(),
		staleTime: 1000 * 60 * 5,
		enabled: !!storedUser,
	});

	// Prefer fresh server data, fall back to store
	const user = meData?.user ?? storedUser;

	useEffect(() => {
		if (meData?.user && meData.user.id !== storedUser?.id) {
			setUser(meData.user);
		}
	}, [meData?.user, setUser, storedUser?.id]);

	const logout = useMutation({
		mutationFn: () => logoutToRootSignin(clearAuth),
		onSuccess: () => {
			toast.success("You've been signed out.");
		},
	});

	if (!user) return null;

	const initials = getInitials(user.name);
	const roleLabel = isSuperAdmin(user)
		? "Super Admin"
		: user.role
			? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
			: "Member";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2"
					aria-label="Account menu"
				>
					<Avatar className="size-8 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
						<AvatarImage src={undefined} />
						<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
							{initials}
						</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64">
				{/* Profile header */}
				<DropdownMenuLabel className="p-0">
					<div className="flex items-center gap-3 px-3 py-3">
						<Avatar className="size-10 shrink-0">
							<AvatarImage src={undefined} />
							<AvatarFallback className="bg-primary/10 text-primary font-semibold">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-sm text-foreground">{user.name}</p>
							<p className="truncate text-xs text-muted-foreground">{user.email}</p>
							<span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
								{roleLabel}
							</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<IconUser className="size-4" />
						Account
					</DropdownMenuItem>
					<DropdownMenuItem>
						<IconSettings className="size-4" />
						Settings
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<IconCreditCard className="size-4" />
						Plan &amp; Billing
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer text-destructive focus:text-destructive"
					disabled={logout.isPending}
					onClick={() => logout.mutate()}
				>
					{logout.isPending ? (
						<IconLoader className="size-4 animate-spin" />
					) : (
						<IconLogout className="size-4" />
					)}
					{logout.isPending ? "Signing out..." : "Sign out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
