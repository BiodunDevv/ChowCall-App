"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeTogglerProps = {
	className?: string;
};

type ViewTransitionDocument = Document & {
	startViewTransition?: (callback: () => void) => {
		ready: Promise<void>;
		finished: Promise<void>;
	};
};

export function ThemeToggler({ className }: ThemeTogglerProps) {
	const { resolvedTheme, setTheme, theme } = useTheme();
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const [iconDarkMode, setIconDarkMode] = useState(false);
	const mounted = useSyncExternalStore(
		() => () => undefined,
		() => true,
		() => false
	);
	const isDarkMode = (resolvedTheme ?? theme) === "dark";

	useEffect(() => {
		if (!mounted) return;
		setIconDarkMode(isDarkMode);
	}, [isDarkMode, mounted]);

	const changeTheme = useCallback(async () => {
		const newTheme = isDarkMode ? "light" : "dark";
		const transitionDocument = document as ViewTransitionDocument;

		if (!buttonRef.current || !transitionDocument.startViewTransition) {
			setTheme(newTheme);
			setIconDarkMode(!isDarkMode);
			return;
		}

		const transition = transitionDocument.startViewTransition(() => {
			flushSync(() => {
				setTheme(newTheme);
			});
		});

		await transition.ready;

		const { top, left, width, height } =
			buttonRef.current.getBoundingClientRect();
		const y = top + height / 2;
		const x = left + width / 2;
		const right = window.innerWidth - left;
		const bottom = window.innerHeight - top;
		const maxRadius = Math.hypot(
			Math.max(left, right),
			Math.max(top, bottom)
		);

		document.documentElement.animate(
			{
				clipPath: [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${maxRadius}px at ${x}px ${y}px)`,
				],
			},
			{
				duration: 650,
				easing: "ease-in-out",
				pseudoElement: "::view-transition-new(root)",
			}
		);

		await transition.finished;
		setIconDarkMode(!isDarkMode);
	}, [isDarkMode, setTheme]);

	if (!mounted) {
		return null;
	}

	return (
		<Button
			aria-label="Toggle theme"
			className={cn("relative", className)}
			onClick={() => void changeTheme()}
			ref={buttonRef}
			size="icon"
			title="Toggle theme"
			type="button"
			variant="outline"
		>
			<IconSun
				className={cn(
					"size-4 transition-all",
					iconDarkMode ? "-rotate-90 scale-0" : "rotate-0 scale-100"
				)}
			/>
			<IconMoon
				className={cn(
					"absolute size-4 transition-all",
					iconDarkMode ? "rotate-0 scale-100" : "rotate-90 scale-0"
				)}
			/>
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
