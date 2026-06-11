import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { IconHome, IconArrowLeft } from "@tabler/icons-react";

export function NotFoundPage() {
	return (
		<div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background">
			{/* Background decoration */}
			<div className="pointer-events-none absolute inset-0 opacity-30">
				<FloatingPaths position={1} />
				<FloatingPaths position={-1} />
			</div>

			{/* Header */}
			<header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
				<Link
					href="/"
					aria-label="ChowCall home"
					className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:opacity-80 transition-opacity"
				>
					<Image
						alt="ChowCall"
						src="/chowcall-logo.svg"
						width={32}
						height={32}
						className="h-8 w-8 object-contain"
					/>
					<span className="text-sm font-semibold tracking-tight text-foreground">
						ChowCall
					</span>
				</Link>
			</header>

			{/* Main content */}
			<div className="relative z-10 flex flex-1 items-center justify-center px-6 py-20">
				<Empty className="border-0 bg-transparent">
					<EmptyHeader>
						<EmptyTitle className="mask-b-from-20% mask-b-to-80% font-extrabold text-9xl text-foreground/90">
							404
						</EmptyTitle>
						<EmptyDescription className="-mt-6 max-w-sm text-balance text-base text-foreground/70">
							This page doesn&apos;t exist or may have been moved.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<div className="flex flex-wrap justify-center gap-2">
							<Button asChild>
								<Link href="/">
									<IconHome className="size-4" />
									Go home
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/auth/signin">
									<IconArrowLeft className="size-4" />
									Sign in
								</Link>
							</Button>
						</div>
					</EmptyContent>
				</Empty>
			</div>

			{/* Footer */}
			<footer className="relative z-10 flex items-center justify-center gap-2 border-t py-5 text-sm text-muted-foreground">
				<span>Powered by</span>
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors"
				>
					<Image
						alt="ChowCall"
						src="/chowcall-logo.svg"
						width={16}
						height={16}
						className="h-4 w-4 object-contain"
					/>
					ChowCall
				</Link>
			</footer>
		</div>
	);
}
