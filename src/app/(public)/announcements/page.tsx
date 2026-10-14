import { Suspense } from "react";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { DataBanner, EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { getPublicData } from "@/lib/data";
import { categoryLabel, formatInTimeZone } from "@/lib/labels";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Announcements" };

export default function AnnouncementsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading announcements" />}>
      <AnnouncementsContent />
    </Suspense>
  );
}

async function AnnouncementsContent() {
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;
  const items = [...result.data.announcements].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
  });

  return (
    <div className="space-y-6">
      <DataBanner source={result.data.source} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Announcements</h1>
          <p className="mt-2 text-sm text-muted-foreground">Published notices only. Drafts stay in the admin panel.</p>
        </div>
        <RealtimeRefresh enabled={isSupabaseConfigured()} />
      </div>
      {items.length === 0 ? (
        <EmptyState title="No announcements" body="Nothing has been published yet." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card/80 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={item.category === "important" ? "border-primary/50 text-primary-foreground" : undefined}>
                  {categoryLabel(item.category)}
                </Badge>
                <span className="text-xs text-muted-foreground">Priority {item.priority}</span>
                <time className="text-xs text-muted-foreground" dateTime={item.publishedAt ?? undefined}>
                  {formatInTimeZone(item.publishedAt, result.data.settings.timezone)}
                </time>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
