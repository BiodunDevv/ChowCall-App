"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setTokenCookie, clearTokenCookie } from "@/lib/token";

export type AuthRole = "SUPER_ADMIN" | "TENANT_ADMIN" | "TENANT_USER" | string;

export type AuthTenant = {
	id?: string;
	name?: string;
	slug?: string;
	logoUrl?: string;
	onboardingStatus?: string | null;
	subscriptionStatus?: string | null;
};

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	role?: AuthRole;
	twoFaEnabled?: boolean;
	tenant?: AuthTenant | null;
	tenantSlug?: string | null;
};

export type PendingOtp = {
	email: string;
	loginToken?: string | null;
	tenantSlug?: string | null;
};

type AuthState = {
	user: AuthUser | null;
	pendingOtp: PendingOtp | null;
	setUser: (user: AuthUser | null) => void;
	/** Call after every successful auth to persist the JWT to a shared subdomain cookie */
	setTokens: (accessToken: string | null) => void;
	setPendingOtp: (pendingOtp: PendingOtp | null) => void;
	clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			pendingOtp: null,
			setUser: (user) => set({ user, pendingOtp: null }),
			setTokens: (accessToken) => {
				if (accessToken) setTokenCookie(accessToken);
				else clearTokenCookie();
			},
			setPendingOtp: (pendingOtp) => set({ pendingOtp }),
			clearAuth: () => {
				clearTokenCookie();
				set({ user: null, pendingOtp: null });
			},
		}),
		{
			name: "chowcall-auth",
			partialize: (state) => ({
				user: state.user,
				pendingOtp: state.pendingOtp,
			}),
		},
	),
);
