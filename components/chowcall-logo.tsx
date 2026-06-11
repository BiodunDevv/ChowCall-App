import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type ChowCallLogoProps = {
	className?: string;
	href?: string;
	imageClassName?: string;
	showText?: boolean;
	textClassName?: string;
};

export function ChowCallLogo({
	className,
	href = "/",
	imageClassName,
	showText = true,
	textClassName,
}: ChowCallLogoProps) {
	return (
		<Link
			aria-label="ChowCall home"
			className={cn(
				"inline-flex items-center rounded-md hover:bg-muted dark:hover:bg-muted/50",
				className,
			)}
			href={href}
		>
			<Image
				alt="ChowCall"
				className={cn("h-10 w-10 object-contain", imageClassName)}
				height={40}
				src="/chowcall-logo.svg"
				width={40}
			/>
			{showText ? (
				<span
					className={cn(
						"text-base font-semibold tracking-tight text-foreground",
						textClassName,
					)}
				>
					ChowCall
				</span>
			) : null}
		</Link>
	);
}
