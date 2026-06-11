"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { IconMapPin, IconLoader, IconX } from "@tabler/icons-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const SEARCH_ENDPOINT = "https://api.mapbox.com/search/geocode/v6/forward";

type MapboxFeature = {
	id: string;
	properties: {
		full_address?: string;
		name?: string;
		place_formatted?: string;
		coordinates?: { latitude: number; longitude: number };
	};
};

type MapboxResponse = {
	features: MapboxFeature[];
};

export type AddressResult = {
	address: string;
	lat: number;
	lng: number;
};

type AddressPickerProps = {
	value?: string;
	placeholder?: string;
	className?: string;
	onChange?: (result: AddressResult | null) => void;
};

function useDebounce<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);
	return debounced;
}

async function fetchSuggestions(query: string): Promise<MapboxFeature[]> {
	if (!query.trim() || !MAPBOX_TOKEN) return [];
	const params = new URLSearchParams({
		q: query,
		access_token: MAPBOX_TOKEN,
		limit: "6",
		// Bias results toward Nigeria
		proximity: "3.3792,6.5244",
		country: "NG",
		language: "en",
	});
	const res = await fetch(`${SEARCH_ENDPOINT}?${params}`);
	if (!res.ok) return [];
	const data = (await res.json()) as MapboxResponse;
	return data.features ?? [];
}

function getLabel(feature: MapboxFeature): string {
	return (
		feature.properties.full_address ??
		feature.properties.place_formatted ??
		feature.properties.name ??
		""
	);
}

export function AddressPicker({
	value = "",
	placeholder = "Search for an address…",
	className,
	onChange,
}: AddressPickerProps) {
	const [inputValue, setInputValue] = useState(value);
	const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [selected, setSelected] = useState(!!value);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const debouncedQuery = useDebounce(inputValue, 320);

	// Fetch when debounced query changes (skip if user just selected an item)
	useEffect(() => {
		if (selected) return;
		if (!debouncedQuery.trim()) {
			setSuggestions([]);
			setOpen(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		fetchSuggestions(debouncedQuery)
			.then((results) => {
				if (cancelled) return;
				setSuggestions(results);
				setOpen(results.length > 0);
				setActiveIndex(-1);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [debouncedQuery, selected]);

	// Close on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (!containerRef.current?.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const handleSelect = useCallback(
		(feature: MapboxFeature) => {
			const label = getLabel(feature);
			const lat = feature.properties.coordinates?.latitude ?? 0;
			const lng = feature.properties.coordinates?.longitude ?? 0;
			setInputValue(label);
			setSelected(true);
			setOpen(false);
			setSuggestions([]);
			onChange?.({ address: label, lat, lng });
			inputRef.current?.blur();
		},
		[onChange],
	);

	const handleClear = useCallback(() => {
		setInputValue("");
		setSelected(false);
		setSuggestions([]);
		setOpen(false);
		onChange?.(null);
		inputRef.current?.focus();
	}, [onChange]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!open) return;
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setActiveIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" && activeIndex >= 0) {
				e.preventDefault();
				const feature = suggestions[activeIndex];
				if (feature) handleSelect(feature);
			} else if (e.key === "Escape") {
				setOpen(false);
			}
		},
		[open, suggestions, activeIndex, handleSelect],
	);

	return (
		<div ref={containerRef} className={cn("relative w-full", className)}>
			{/* Input */}
			<div className="relative flex items-center">
				<IconMapPin className="pointer-events-none absolute left-3 size-4 shrink-0 text-muted-foreground" />
				<input
					ref={inputRef}
					type="text"
					role="combobox"
					aria-expanded={open}
					aria-autocomplete="list"
					autoComplete="off"
					spellCheck={false}
					placeholder={placeholder}
					value={inputValue}
					className={cn(
						"h-11 w-full rounded-lg border bg-background pl-9 pr-9 text-sm",
						"placeholder:text-muted-foreground",
						"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
						"transition-shadow",
					)}
					onChange={(e) => {
						setSelected(false);
						setInputValue(e.target.value);
					}}
					onFocus={() => {
						if (suggestions.length > 0) setOpen(true);
					}}
					onKeyDown={handleKeyDown}
				/>
				{/* Right icon — spinner or clear */}
				<div className="absolute right-3 flex items-center">
					{loading ? (
						<IconLoader className="size-4 animate-spin text-muted-foreground" />
					) : inputValue ? (
						<button
							type="button"
							onClick={handleClear}
							className="rounded p-0.5 text-muted-foreground hover:text-foreground focus:outline-none"
							aria-label="Clear address"
						>
							<IconX className="size-3.5" />
						</button>
					) : null}
				</div>
			</div>

			{/* Dropdown */}
			{open && suggestions.length > 0 && (
				<ul
					role="listbox"
					className={cn(
						"absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md",
						"animate-in fade-in-0 zoom-in-95 duration-100",
					)}
				>
					{suggestions.map((feature, index) => {
						const label = getLabel(feature);
						const isActive = index === activeIndex;
						return (
							<li
								key={feature.id}
								role="option"
								aria-selected={isActive}
								className={cn(
									"flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm transition-colors",
									isActive
										? "bg-accent text-accent-foreground"
										: "hover:bg-accent/50",
								)}
								onMouseDown={(e) => {
									e.preventDefault(); // prevent input blur before click fires
									handleSelect(feature);
								}}
								onMouseEnter={() => setActiveIndex(index)}
							>
								<IconMapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
								<span className="leading-snug">{label}</span>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
