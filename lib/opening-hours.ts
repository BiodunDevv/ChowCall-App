import type { PublicTenant } from "@/lib/public-ordering";

export function isOpenNow(openingHours: PublicTenant["openingHours"]): boolean {
  if (!openingHours || typeof openingHours !== "object" || Array.isArray(openingHours)) return true;
  const keys = Object.keys(openingHours as object);
  // No schedule configured — treat as always open
  if (keys.length === 0) return true;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  const schedule = openingHours as Record<string, { open?: boolean; from?: string; to?: string }>;
  const day = schedule[today];
  // Day not configured in schedule — treat as closed
  if (!day) return false;
  if (!day.open) return false;
  if (!day.from || !day.to) return true;
  const now = new Date();
  const [fh, fm] = day.from.split(":").map(Number);
  const [th, tm] = day.to.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= fh * 60 + fm && nowMins <= th * 60 + tm;
}

export function getNextOpeningTime(openingHours: PublicTenant["openingHours"]): string | null {
  if (!openingHours || typeof openingHours !== "object" || Array.isArray(openingHours)) return null;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const schedule = openingHours as Record<string, { open?: boolean; from?: string; to?: string }>;
  for (let i = 1; i <= 7; i++) {
    const idx = (new Date().getDay() + i) % 7;
    const day = schedule[days[idx]];
    if (day?.open && day.from) {
      const dayName = i === 1 ? "Tomorrow" : days[idx].charAt(0).toUpperCase() + days[idx].slice(1);
      return `${dayName} at ${day.from}`;
    }
  }
  return null;
}
