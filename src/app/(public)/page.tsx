import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { DataBanner, EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicData } from "@/lib/data";
import { formatInTimeZone, categoryLabel } from "@/lib/labels";
import { assignmentCounts, computeStats } from "@/lib/stats";

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading the event overview" />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;
  const { data } = result;
  const stats = computeStats(data.teams);
  const counts = assignmentCounts(data.teams);
  const featuredProblems = [...data.problems]
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.title.localeCompare(b.title))
    .slice(0, 3);
  const announcements = [...data.announcements].sort((a, b) => b.priority - a.priority).slice(0, 3);

  return (
    <div className="space-y-14">
      <DataBanner source={data.source} />
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">24-hour hackathon</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            24 Hours. One Mission: Build What&apos;s Next.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            One intense day of problem-solving, engineering, collaboration, and innovation.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Organized by the Coding Club and AI Frontier Club.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Explore Live Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/teams">Find Your Team</Link>
            </Button>
          </div>
        </div>
        <Countdown
          startAt={data.settings.startAt}
          endAt={data.settings.endAt}
          serverNow={data.serverNow}
          timeZone={data.settings.timezone}
          statusOverride={data.settings.statusOverride}
        />
      </section>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xl font-semibold">
          Live event statistics
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Counts come from the current team and submission records. Active teams are those marked in progress.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total teams" value={stats.totalTeams} />
          <Stat label="Active teams" value={stats.activeTeams} />
          <Stat label="Submitted projects" value={stats.submittedProjects} />
          <Stat label="Pending submissions" value={stats.pendingSubmissions} />
        </div>
      </section>

      <section aria-labelledby="timeline-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="timeline-heading" className="text-xl font-semibold">
            Event timeline
          </h2>
          <Link href="/schedule" className="text-sm text-accent hover:underline">
            Full schedule
          </Link>
        </div>
        {data.schedule.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No milestones yet"
              body="Organizers have not published the run of show. The schedule page will fill in once those times are saved."
            />
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {data.schedule.slice(0, 4).map((item) => (
              <li key={item.id} className="grid gap-2 rounded-2xl border border-border bg-card/70 p-4 sm:grid-cols-[180px_1fr]">
                <time className="font-mono text-xs text-accent" dateTime={item.startsAt}>
                  {formatInTimeZone(item.startsAt, data.settings.timezone)}
                </time>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="announcements-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="announcements-heading" className="text-xl font-semibold">
            Featured announcements
          </h2>
          <Link href="/announcements" className="text-sm text-accent hover:underline">
            All announcements
          </Link>
        </div>
        {announcements.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No published announcements" body="Official notices will appear here after an administrator publishes them." />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {announcements.map((item) => (
              <Card key={item.id}>
                <CardContent>
                  <p className="text-xs uppercase tracking-wide text-accent">{categoryLabel(item.category)}</p>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{item.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="problems-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="problems-heading" className="text-xl font-semibold">
            Featured problem statements
          </h2>
          <Link href="/problems" className="text-sm text-accent hover:underline">
            All problems
          </Link>
        </div>
        {featuredProblems.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No published problem statements" body="Assigned briefs will show here once organizers publish them." />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {featuredProblems.map((problem) => (
              <Link key={problem.id} href={`/problems/${problem.id}`} className="rounded-2xl focus-visible:ring-2">
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent>
                    <p className="font-mono text-xs text-accent">{problem.id}</p>
                    <h3 className="mt-2 font-semibold">{problem.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{problem.summary}</p>
                    <p className="mt-4 text-sm">
                      {counts.get(problem.id) ?? 0} assigned {(counts.get(problem.id) ?? 0) === 1 ? "team" : "teams"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
