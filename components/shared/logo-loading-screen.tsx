import Image from "next/image";

type LogoLoadingScreenProps = {
	fixed?: boolean;
};

export function LogoLoadingScreen({ fixed = true }: LogoLoadingScreenProps) {
	return (
		<div
			className={
				fixed
					? "fixed inset-0 z-50 flex items-center justify-center bg-background/95"
					: "flex min-h-[360px] items-center justify-center"
			}
		>
			<div className="relative flex size-20 items-center justify-center">
				<div className="absolute inset-0 rounded-full border border-border" />
				<div className="absolute inset-0 rounded-full border border-transparent border-t-foreground/70 animate-spin" />
				<Image
					alt="ChowCall"
					className="h-10 w-10 object-contain"
					height={40}
					priority
					src="/chowcall-logo.svg"
					width={40}
				/>
			</div>
		</div>
	);
}
