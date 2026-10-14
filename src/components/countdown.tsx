"use client";

import { useEffect, useState } from "react";
import { deriveEventClock, splitDuration } from "@/lib/countdown";
import type { StatusOverride } from "@/lib/types";
import { overrideLabel } from "@/lib/labels";

type CountdownProps = {
  startAt: string | null;
  endAt: string | null;
  serverNow: number;
  timeZone: string;
  statusOverride: StatusOverride | null;
};

export function Countdown({ startAt, endAt, serverNow, timeZone, statusOverride }: CountdownProps) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const offset = serverNow - Date.now();
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [serverNow]);

  const clock = deriveEventClock(now, startAt, endAt);
  const parts = clock.remainingMs === null ? null : splitDuration(clock.remainingMs);
  const phaseLabel =
    clock.phase === "live" ? "Live" : clock.phase === "before" ? "Upcoming" : clock.phase === "ended" ? "Ended" : "Clock";

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 sm:p-6" aria-labelledby="event-clock-heading">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary-foreground">
          {statusOverride ? overrideLabel(statusOverride) : phaseLabel}
        </span>
        {clock.phase === "live" && !statusOverride ? (
          <span className="text-xs text-accent">Event window is open</span>
        ) : null}
        <span className="text-xs text-muted-foreground">Official zone: {timeZone}</span>
      </div>
      <h2 id="event-clock-heading" className="mt-4 text-lg font-semibold">
        {clock.headline}
      </h2>
      {parts ? (
        <div className="mt-4 grid grid-cols-4 gap-2" aria-live="off">
          <TimeUnit value={parts.days} label="Days" />
          <TimeUnit value={parts.hours} label="Hours" />
          <TimeUnit value={parts.minutes} label="Minutes" />
          <TimeUnit value={parts.seconds} label="Seconds" />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{clock.detail}</p>
      )}
      {parts ? <p className="mt-4 text-sm text-muted-foreground">{clock.detail}</p> : null}
      {statusOverride ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Organizer status override is active. The countdown still follows the configured timestamps.
        </p>
      ) : null}
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/70 px-2 py-3 text-center">
      <div className="font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
