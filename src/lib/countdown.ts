export type ClockPhase = "unconfigured" | "invalid" | "before" | "live" | "ended";

export type EventClock = {
  phase: ClockPhase;
  remainingMs: number | null;
  headline: string;
  detail: string;
};

const OFFSET = /(Z|[+-]\d{2}:\d{2})$/i;

export function hasExplicitOffset(value: string) {
  return OFFSET.test(value.trim());
}

export function parseEventInstant(value: string | null | undefined) {
  if (!value || !value.trim()) return { ok: false as const, reason: "missing" as const };
  const trimmed = value.trim();
  if (!hasExplicitOffset(trimmed)) {
    return { ok: false as const, reason: "missing-offset" as const };
  }
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return { ok: false as const, reason: "invalid" as const };
  return { ok: true as const, ms };
}

export function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function deriveEventClock(
  nowMs: number,
  startAt: string | null,
  endAt: string | null,
): EventClock {
  const start = parseEventInstant(startAt);
  const end = parseEventInstant(endAt);

  if (start.reason === "missing" || end.reason === "missing") {
    return {
      phase: "unconfigured",
      remainingMs: null,
      headline: "Event clock is not configured",
      detail: "Organizers still need to set a start and end time with an explicit offset.",
    };
  }

  if (!start.ok || !end.ok || end.ms <= start.ms) {
    return {
      phase: "invalid",
      remainingMs: null,
      headline: "Event clock needs attention",
      detail: "The saved start and end timestamps are missing an offset, are invalid, or end before they start.",
    };
  }

  if (nowMs < start.ms) {
    return {
      phase: "before",
      remainingMs: start.ms - nowMs,
      headline: "Event starts in",
      detail: "The countdown follows the configured start time and does not reset on refresh.",
    };
  }

  if (nowMs < end.ms) {
    return {
      phase: "live",
      remainingMs: end.ms - nowMs,
      headline: "Time remaining",
      detail: "The 24-hour window is open. Remaining time is calculated from the configured end time.",
    };
  }

  return {
    phase: "ended",
    remainingMs: 0,
    headline: "The 24-hour event has ended",
    detail: "The configured end time has passed.",
  };
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
