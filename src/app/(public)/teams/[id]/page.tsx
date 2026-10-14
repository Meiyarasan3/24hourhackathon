import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DataBanner, ErrorState, LoadingBlock } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { getPublicData } from "@/lib/data";
import { formatInTimeZone, isSubmittedStatus } from "@/lib/labels";

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading team" />}>
      <TeamContent params={params} />
    </Suspense>
  );
}

async function TeamContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;
  const team = result.data.teams.find((item) => item.id === id);
  if (!team) notFound();

  return (
    <article className="space-y-6">
      <DataBanner source={result.data.source} />
      <p className="text-sm">
        <Link href="/teams" className="text-accent hover:underline">
          All teams
        </Link>
      </p>
      <header>
        <p className="font-mono text-sm text-accent">{team.id}</p>
        <h1 className="mt-1 text-3xl font-semibold">{team.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{team.memberCount} members</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status={team.progressStatus} />
          <StatusBadge status={team.submission?.status ?? "not_started"} />
        </div>
      </header>
      <section className="rounded-2xl border border-border p-5">
        <h2 className="text-lg font-semibold">Assigned problem statement</h2>
        {team.problem ? (
          <div className="mt-3 space-y-4">
            <p className="font-mono text-xs text-accent">{team.problem.id}</p>
            <h3 className="text-xl font-semibold">
              <Link href={`/problems/${team.problem.id}`} className="hover:text-accent">
                {team.problem.title}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">{team.problem.summary}</p>
            <DetailList title="Functional requirements" items={team.problem.functionalRequirements} />
            <DetailList title="Expected deliverables" items={team.problem.expectedDeliverables} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No problem statement is assigned to this team.</p>
        )}
      </section>
      <section className="rounded-2xl border border-border p-5">
        <h2 className="text-lg font-semibold">Submission</h2>
        {team.submission && isSubmittedStatus(team.submission.status) ? (
          <p className="mt-3 text-sm text-muted-foreground">
            A submission record exists. Handed in {formatInTimeZone(team.submission.submittedAt, result.data.settings.timezone)}.
            The project URL is visible to administrators only.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {team.submission
              ? "A submission record exists, and it is not marked as handed in."
              : "There is no submission record for this team. This is not a submitted project."}
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Last updated {formatInTimeZone(team.lastUpdated, result.data.settings.timezone)}
        </p>
      </section>
    </article>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">None listed.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
