import { Suspense } from "react";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { DataBanner, EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { getPublicData } from "@/lib/data";
import { isSubmittedStatus, progressLabel } from "@/lib/labels";
import { computeStats } from "@/lib/stats";
import { PROGRESS_STATUSES } from "@/lib/types";

export const metadata = { title: "Live Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading the live dashboard" />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;
  const { data } = result;
  const stats = computeStats(data.teams);
  const pending = data.teams.filter((team) => !isSubmittedStatus(team.submission?.status));

  return (
    <div className="space-y-8">
      <DataBanner source={data.source} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Live dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Event progress, submission coverage, and the latest published notices. Refreshing this page reads the current records again.
        </p>
      </div>
      <Countdown
        startAt={data.settings.startAt}
        endAt={data.settings.endAt}
        serverNow={data.serverNow}
        timeZone={data.settings.timezone}
        statusOverride={data.settings.statusOverride}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total teams" value={stats.totalTeams} />
        <Metric label="Active teams" value={stats.activeTeams} />
        <Metric label="Submitted projects" value={stats.submittedProjects} />
        <Metric label="Pending submissions" value={stats.pendingSubmissions} />
      </div>
      <section aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="text-xl font-semibold">
          Progress breakdown
        </h2>
        <ul className="mt-4 space-y-2">
          {PROGRESS_STATUSES.map((status) => {
            const count = data.teams.filter((team) => team.progressStatus === status).length;
            const width = data.teams.length ? Math.round((count / data.teams.length) * 100) : 0;
            return (
              <li key={status} className="grid items-center gap-3 sm:grid-cols-[140px_1fr_40px]">
                <span className="text-sm">{progressLabel(status)}</span>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
                </div>
                <span className="font-mono text-sm tabular-nums">{count}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="text-xl font-semibold">
          Teams without a submitted project
        </h2>
        {pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Every public team has a submission record" body="Submitted, under review, and evaluated records are counted as handed in." />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {pending.slice(0, 8).map((team) => (
              <li key={team.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <Link href={`/teams/${team.id}`} className="font-medium hover:text-accent">
                    {team.name}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">{team.id}</p>
                </div>
                <StatusBadge status={team.submission?.status ?? "not_started"} />
              </li>
            ))}
          </ul>
        )}
        {pending.length > 8 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Showing 8 of {pending.length}.{" "}
            <Link href="/teams?submission=pending" className="text-accent hover:underline">
              View the full directory
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl tabular-nums">{value}</p>
    </div>
  );
}
