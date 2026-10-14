import Link from "next/link";
import { Suspense } from "react";
import { ErrorState, LoadingBlock } from "@/components/states";
import { getAdminBundle } from "@/lib/data";
import { deriveEventClock } from "@/lib/countdown";
import { computeStats } from "@/lib/stats";

export const metadata = { title: "Admin" };

export default function AdminHome() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading overview" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  const stats = computeStats(result.data.allTeams);
  const clock = deriveEventClock(result.data.serverNow, result.data.settings.startAt, result.data.settings.endAt);
  const drafts = result.data.allAnnouncements.filter((item) => !item.isPublished).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Command overview</h1>
      <p className="text-sm text-muted-foreground">
        Clock: {clock.headline}. Draft announcements: {drafts}. Evaluation scoring is disabled.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Teams" value={stats.totalTeams} />
        <Stat label="Active" value={stats.activeTeams} />
        <Stat label="Submitted" value={stats.submittedProjects} />
        <Stat label="Pending" value={stats.pendingSubmissions} />
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li><Link className="text-accent hover:underline" href="/admin/teams">Manage teams and assignments</Link></li>
        <li><Link className="text-accent hover:underline" href="/admin/announcements">Publish an announcement</Link></li>
        <li><Link className="text-accent hover:underline" href="/admin/submissions">Update submission status</Link></li>
        <li><Link className="text-accent hover:underline" href="/admin/import">Import a verified CSV</Link></li>
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-3xl">{value}</p>
    </div>
  );
}
