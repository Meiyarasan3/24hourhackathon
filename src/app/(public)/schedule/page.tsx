import { Suspense } from "react";
import { DataBanner, EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { getPublicData } from "@/lib/data";
import { formatInTimeZone } from "@/lib/labels";

export const metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading the schedule" />}>
      <ScheduleContent />
    </Suspense>
  );
}

async function ScheduleContent() {
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;

  return (
    <div className="space-y-6">
      <DataBanner source={result.data.source} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Times use {result.data.settings.timezone}. They are the saved milestone timestamps, not the browser clock.
        </p>
      </div>
      {result.data.schedule.length === 0 ? (
        <EmptyState title="Schedule not published" body="Organizers have not added milestones yet." />
      ) : (
        <ol className="space-y-3">
          {result.data.schedule.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card/80 p-5">
              <time className="font-mono text-xs text-accent" dateTime={item.startsAt}>
                {formatInTimeZone(item.startsAt, result.data.settings.timezone)}
                {item.endsAt ? ` – ${formatInTimeZone(item.endsAt, result.data.settings.timezone)}` : ""}
              </time>
              <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
