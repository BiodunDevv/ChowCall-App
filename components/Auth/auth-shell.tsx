import { FloatingPaths } from "@/components/Auth/floating-paths";
import { ChowCallLogo } from "@/components/chowcall-logo";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
import { Button } from "@/components/ui/button";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

type AuthShellProps = {
	children: React.ReactNode;
	quote?: string;
	quoteAuthor?: string;
};

export function AuthShell({
	children,
	quote = "This Platform has helped me to save time and serve my clients faster than ever before.",
	quoteAuthor = "Ali Hassan",
}: AuthShellProps) {
	return (
		<main className="relative h-screen overflow-hidden bg-background lg:grid lg:grid-cols-2">
			<div className="relative hidden h-full min-h-screen flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
				<ChowCallLogo
					className="z-10 mr-auto px-1 py-0.5"
					textClassName="text-lg"
				/>

				<div className="z-10 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-xl">&ldquo;{quote}&rdquo;</p>
						<footer className="font-mono font-semibold text-sm">
							~ {quoteAuthor}
						</footer>
					</blockquote>
				</div>
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>
			<div className="relative flex h-screen min-h-0 flex-col overflow-hidden px-4 pb-4 pt-20 sm:px-6 lg:justify-center lg:px-8 lg:py-20">
				<div
					aria-hidden
					className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
				>
					<div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
					<div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
					<div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
				</div>
				<div className="absolute left-4 top-5 z-20 flex items-center gap-1 sm:left-6 lg:left-8">
					<Button asChild className="h-9 px-2" variant="ghost">
						<Link href="/">
							<IconChevronLeft data-icon="inline-start" />
							Home
						</Link>
					</Button>
				</div>

				<div className="absolute right-4 top-5 z-20 flex items-center gap-2 sm:right-6">
					<ChowCallLogo className="h-9 px-2 lg:hidden" />
					<ThemeToggler className="size-9" />
				</div>

				<div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center lg:block lg:flex-none">
					<div className="min-h-0 rounded-xl border bg-background/90 p-4 shadow-sm backdrop-blur sm:p-5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
						{children}
					</div>
				</div>
			</div>
		</main>
	);
}
