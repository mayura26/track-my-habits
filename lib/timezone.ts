const partFormatterCache = new Map<string, Intl.DateTimeFormat>();
const weekdayFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timezone: string): Intl.DateTimeFormat {
  const key = timezone;
  const cached = partFormatterCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  partFormatterCache.set(key, formatter);
  return formatter;
}

function getWeekdayFormatter(timezone: string): Intl.DateTimeFormat {
  const key = timezone;
  const cached = weekdayFormatterCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  weekdayFormatterCache.set(key, formatter);
  return formatter;
}

function parseParts(date: Date, timezone: string) {
  const parts = getPartsFormatter(timezone).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function shortWeekdayToIndex(weekday: string): number {
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export function normalizeTimezone(value?: string | null): string {
  const zone = value?.trim() || "UTC";
  try {
    // Throws on invalid zone.
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

export function getLocalDateKey(date: Date, timezone: string): string {
  const p = parseParts(date, normalizeTimezone(timezone));
  return `${p.year.toString().padStart(4, "0")}-${p.month.toString().padStart(2, "0")}-${p.day.toString().padStart(2, "0")}`;
}

export function getTimePartsInTimezone(date: Date, timezone: string) {
  const zone = normalizeTimezone(timezone);
  const p = parseParts(date, zone);
  const weekday = getWeekdayFormatter(zone).format(date);
  return {
    ...p,
    weekdayIndex: shortWeekdayToIndex(weekday),
  };
}

export function zonedDateTimeToUtc(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  const zone = normalizeTimezone(timezone);
  let guess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const target = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  for (let i = 0; i < 3; i += 1) {
    const p = parseParts(new Date(guess), zone);
    const represented = Date.UTC(
      p.year,
      p.month - 1,
      p.day,
      p.hour,
      p.minute,
      p.second,
      ms,
    );
    guess += target - represented;
  }
  return new Date(guess);
}

export function startOfDayInTimezone(date: Date, timezone: string): Date {
  const p = getTimePartsInTimezone(date, timezone);
  return zonedDateTimeToUtc(timezone, p.year, p.month, p.day, 0, 0, 0, 0);
}

export function endOfDayInTimezone(date: Date, timezone: string): Date {
  const start = startOfDayInTimezone(date, timezone);
  const next = new Date(start.getTime());
  next.setUTCDate(next.getUTCDate() + 1);
  return new Date(next.getTime() - 1);
}
