"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { IconChevronDown, IconClock } from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DaySchedule = {
	open: boolean;
	from: string; // "HH:MM" 24-hour
	to: string;   // "HH:MM" 24-hour
};

export type WeeklySchedule = Record<string, DaySchedule>;

type OpeningHoursPickerProps = {
	value?: WeeklySchedule;
	onChange?: (schedule: WeeklySchedule) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
	{ key: "monday",    short: "Mon", label: "Monday" },
	{ key: "tuesday",  short: "Tue", label: "Tuesday" },
	{ key: "wednesday",short: "Wed", label: "Wednesday" },
	{ key: "thursday", short: "Thu", label: "Thursday" },
	{ key: "friday",   short: "Fri", label: "Friday" },
	{ key: "saturday", short: "Sat", label: "Saturday" },
	{ key: "sunday",   short: "Sun", label: "Sunday" },
];

// Quarter-hour slots: 00:00 → 23:45
const TIME_SLOTS: string[] = (() => {
	const slots: string[] = [];
	for (let h = 0; h < 24; h++) {
		for (let m = 0; m < 60; m += 30) {
			slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
		}
	}
	return slots;
})();

const DEFAULT_FROM = "08:00";
const DEFAULT_TO   = "22:00";

function defaultSchedule(): WeeklySchedule {
	return Object.fromEntries(
		DAYS.map(({ key }, i) => [
			key,
			{
				open: i < 6, // Mon–Sat open by default, Sun closed
				from: DEFAULT_FROM,
				to:   DEFAULT_TO,
			},
		]),
	);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function to12h(time: string): string {
	const [h, m] = time.split(":").map(Number);
	if (h === undefined || m === undefined) return time;
	const period = h >= 12 ? "PM" : "AM";
	const hour   = h === 0 ? 12 : h > 12 ? h - 12 : h;
	return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── Time Select ──────────────────────────────────────────────────────────────

function TimeSelect({
	value,
	onChange,
	disabled,
	label,
}: {
	value: string;
	onChange: (v: string) => void;
	disabled?: boolean;
	label: string;
}) {
	return (
		<div className="relative flex-1">
			<span className="sr-only">{label}</span>
			<select
				value={value}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
				className={cn(
					"h-9 w-full appearance-none rounded-lg border bg-background pl-3 pr-7 text-sm",
					"focus:outline-none focus:ring-2 focus:ring-ring",
					"transition-opacity",
					disabled && "pointer-events-none opacity-40",
				)}
			>
				{TIME_SLOTS.map((t) => (
					<option key={t} value={t}>
						{to12h(t)}
					</option>
				))}
			</select>
			<IconChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
		</div>
	);
}

// ─── Apply-to-all presets ─────────────────────────────────────────────────────

const PRESETS = [
	{ label: "Mon – Fri",  days: ["monday","tuesday","wednesday","thursday","friday"] },
	{ label: "Mon – Sat",  days: ["monday","tuesday","wednesday","thursday","friday","saturday"] },
	{ label: "Every day",  days: DAYS.map((d) => d.key) },
	{ label: "Weekends",   days: ["saturday","sunday"] },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export function OpeningHoursPicker({ value, onChange }: OpeningHoursPickerProps) {
	const [schedule, setSchedule] = useState<WeeklySchedule>(() => ({
		...defaultSchedule(),
		...value,
	}));

	// Sync upward whenever schedule changes
	useEffect(() => {
		onChange?.(schedule);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [schedule]);

	// Restore from parent value when it arrives (e.g. from saved onboarding data)
	useEffect(() => {
		if (value && Object.keys(value).length > 0) {
			setSchedule((prev) => ({ ...defaultSchedule(), ...prev, ...value }));
		}
	// Only run when parent value reference changes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = useCallback(
		(day: string, patch: Partial<DaySchedule>) =>
			setSchedule((s) => ({ ...s, [day]: { ...s[day]!, ...patch } })),
		[],
	);

	const applyPreset = useCallback(
		(days: readonly string[], from: string, to: string) => {
			setSchedule((s) => {
				const next = { ...s };
				// Enable the selected days with the given hours
				days.forEach((d) => { next[d] = { open: true, from, to }; });
				// Disable days not in the preset
				DAYS.forEach(({ key }) => {
					if (!days.includes(key)) next[key] = { ...next[key]!, open: false };
				});
				return next;
			});
		},
		[],
	);

	// Find the first open day's hours to use as preset target
	const firstOpen = DAYS.find(({ key }) => schedule[key]?.open);
	const presetFrom = firstOpen ? schedule[firstOpen.key]!.from : DEFAULT_FROM;
	const presetTo   = firstOpen ? schedule[firstOpen.key]!.to   : DEFAULT_TO;

	return (
		<div className="space-y-3">
			{/* Quick preset chips */}
			<div className="flex flex-wrap gap-2">
				{PRESETS.map((preset) => (
					<button
						key={preset.label}
						type="button"
						onClick={() => applyPreset(preset.days, presetFrom, presetTo)}
						className={cn(
							"inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
							"transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary",
							"focus:outline-none focus:ring-2 focus:ring-ring",
						)}
					>
						{preset.label}
					</button>
				))}
			</div>

			{/* Day rows */}
			<div className="overflow-hidden rounded-xl border divide-y">
				{DAYS.map(({ key, short, label }) => {
					const day = schedule[key] ?? { open: false, from: DEFAULT_FROM, to: DEFAULT_TO };
					return (
						<div
							key={key}
							className={cn(
								"flex items-center gap-3 px-4 py-3 transition-colors",
								day.open ? "bg-background" : "bg-muted/30",
							)}
						>
							{/* Toggle */}
							<Switch
								checked={day.open}
								onCheckedChange={(checked) => update(key, { open: checked })}
								aria-label={`${label} open`}
							/>

							{/* Day name */}
							<span
								className={cn(
									"w-8 shrink-0 text-sm font-medium",
									day.open ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{short}
							</span>

							{day.open ? (
								<>
									{/* From */}
									<TimeSelect
										label={`${label} opens`}
										value={day.from}
										onChange={(v) => update(key, { from: v })}
									/>

									{/* Separator */}
									<span className="shrink-0 text-xs text-muted-foreground">to</span>

									{/* To */}
									<TimeSelect
										label={`${label} closes`}
										value={day.to}
										onChange={(v) => update(key, { to: v })}
									/>

									{/* Visual summary */}
									<div className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
										<IconClock className="size-3" />
										{to12h(day.from)} – {to12h(day.to)}
									</div>
								</>
							) : (
								<span className="flex-1 text-sm text-muted-foreground">Closed</span>
							)}
						</div>
					);
				})}
			</div>

			{/* Live summary pill */}
			<OpenHoursSummary schedule={schedule} />
		</div>
	);
}

// ─── Summary row ──────────────────────────────────────────────────────────────

function OpenHoursSummary({ schedule }: { schedule: WeeklySchedule }) {
	const openDays = DAYS.filter(({ key }) => schedule[key]?.open);
	if (openDays.length === 0) {
		return (
			<p className="text-xs text-muted-foreground">
				No days selected — the restaurant will appear closed.
			</p>
		);
	}

	// Group consecutive days with the same hours
	type Group = { days: string[]; from: string; to: string };
	const groups: Group[] = [];
	for (const { key, short } of openDays) {
		const { from, to } = schedule[key]!;
		const last = groups[groups.length - 1];
		if (last && last.from === from && last.to === to) {
			last.days.push(short);
		} else {
			groups.push({ days: [short], from, to });
		}
	}

	return (
		<div className="flex flex-wrap gap-2">
			{groups.map((g, i) => (
				<span
					key={i}
					className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
				>
					<IconClock className="size-3" />
					{g.days.length === 1
						? g.days[0]
						: `${g.days[0]}–${g.days[g.days.length - 1]}`}{" "}
					· {to12h(g.from)} – {to12h(g.to)}
				</span>
			))}
		</div>
	);
}

// ─── Serialisation helpers (used by onboarding-page) ──────────────────────────

/** Convert WeeklySchedule → a human-readable summary string for the backend */
export function scheduleToSummary(schedule: WeeklySchedule): string {
	const openDays = DAYS.filter(({ key }) => schedule[key]?.open);
	if (openDays.length === 0) return "Closed all week";

	type Group = { days: string[]; from: string; to: string };
	const groups: Group[] = [];
	for (const { key, label } of openDays) {
		const { from, to } = schedule[key]!;
		const last = groups[groups.length - 1];
		if (last && last.from === from && last.to === to) {
			last.days.push(label);
		} else {
			groups.push({ days: [label], from, to });
		}
	}

	return groups
		.map((g) => {
			const range =
				g.days.length === 1
					? g.days[0]
					: `${g.days[0]} – ${g.days[g.days.length - 1]}`;
			return `${range}: ${to12h(g.from)} – ${to12h(g.to)}`;
		})
		.join(", ");
}

/** Parse a saved WeeklySchedule back from step data (stored as JSON string) */
export function parseSavedSchedule(raw: unknown): WeeklySchedule | undefined {
	if (!raw) return undefined;
	try {
		const parsed =
			typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed as WeeklySchedule;
		}
	} catch {
		// ignore parse errors — fall back to default
	}
	return undefined;
}
