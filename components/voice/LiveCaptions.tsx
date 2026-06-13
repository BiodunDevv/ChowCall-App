"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LiveCaption } from "./types";

export function LiveCaptions({ captions }: { captions: LiveCaption[] }) {
	const endRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		endRef.current?.scrollIntoView({ block: "end" });
	}, [captions.length]);

	if (captions.length === 0) {
		return (
			<div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
				Captions will appear here once the live voice order starts.
			</div>
		);
	}

	return (
		<ScrollArea className="h-full max-h-full min-h-0 w-full rounded-lg border bg-card">
			<div className="space-y-3 p-4">
				{captions.map((caption, index) => (
					<div key={`${caption.role}-${index}`} className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground">
							{caption.role === "assistant" ? "ChowCall" : "Customer"}
						</p>
						<p className="text-sm leading-relaxed text-foreground">{caption.text}</p>
					</div>
				))}
				<div ref={endRef} />
			</div>
		</ScrollArea>
	);
}
