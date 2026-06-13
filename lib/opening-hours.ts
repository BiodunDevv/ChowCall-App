import type { PublicTenant } from "@/lib/public-ordering";

type DaySchedule = { open?: boolean; from?: string; to?: string };
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const TIME_ZONE = "Africa/Lagos";

export function isOpenNow(openingHours: PublicTenant["openingHours"], now = new Date()) {
  const schedule = normalizeSchedule(openingHours);
  if (!Object.keys(schedule).length) return true;

  const { dayIndex, minutes } = zonedClock(now);
  if (isOpenDuring(schedule[DAYS[dayIndex]], minutes)) return true;
  return isPreviousOvernightOpen(schedule[DAYS[(dayIndex + 6) % 7]], minutes);
}

export function getNextOpeningTime(openingHours: PublicTenant["openingHours"], now = new Date()) {
  const schedule = normalizeSchedule(openingHours);
  if (!Object.keys(schedule).length || isOpenNow(openingHours, now)) return null;

  const { dayIndex, minutes } = zonedClock(now);
  for (let offset = 0; offset < 7; offset += 1) {
    const candidateIndex = (dayIndex + offset) % 7;
    const day = schedule[DAYS[candidateIndex]];
    if (!day?.open) continue;
    const from = day.from ? toMinutes(day.from) : 0;
    if (from === null || (offset === 0 && from <= minutes)) continue;
    const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : titleCase(DAYS[candidateIndex]);
    return `${label} at ${formatTime(from)}`;
  }
  return null;
}

function normalizeSchedule(openingHours: PublicTenant["openingHours"]) {
  if (!openingHours || typeof openingHours !== "object" || Array.isArray(openingHours)) return {};
  return Object.fromEntries(
    Object.entries(openingHours)
      .map(([key, value]) => [key.trim().toLowerCase(), value] as const)
      .filter(([key, value]) => DAYS.includes(key as (typeof DAYS)[number]) && value && typeof value === "object"),
  ) as Record<string, DaySchedule>;
}

function isOpenDuring(day: DaySchedule | undefined, minutes: number) {
  if (!day?.open) return false;
  if (!day.from || !day.to) return true;
  const from = toMinutes(day.from);
  const to = toMinutes(day.to);
  if (from === null || to === null) return false;
  if (from === to) return true;
  return from < to ? minutes >= from && minutes < to : minutes >= from;
}

function isPreviousOvernightOpen(day: DaySchedule | undefined, minutes: number) {
  if (!day?.open || !day.from || !day.to) return false;
  const from = toMinutes(day.from);
  const to = toMinutes(day.to);
  return from !== null && to !== null && from > to && minutes < to;
}

function zonedClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value.toLowerCase() ?? "sunday";
  return {
    dayIndex: Math.max(0, DAYS.indexOf(weekday as (typeof DAYS)[number])),
    minutes:
      Number(parts.find((part) => part.type === "hour")?.value ?? 0) * 60 +
      Number(parts.find((part) => part.type === "minute")?.value ?? 0),
  };
}

function toMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${period}`;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
