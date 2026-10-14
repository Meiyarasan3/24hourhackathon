import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DataBanner, ErrorState, LoadingBlock } from "@/components/states";
import { getPublicData } from "@/lib/data";

export default function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading problem statement" />}>
      <ProblemContent params={params} />
    </Suspense>
  );
}

async function ProblemContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;
  const problem = result.data.problems.find((item) => item.id === id);
  if (!problem) notFound();
  const teams = result.data.teams.filter((team) => team.assignment?.problemId === problem.id);

  return (
    <article className="space-y-6">
      <DataBanner source={result.data.source} />
      <p className="text-sm">
        <Link href="/problems" className="text-accent hover:underline">
          All problem statements
        </Link>
      </p>
      <header>
        <p className="font-mono text-sm text-accent">{problem.id}</p>
        <h1 className="mt-1 text-3xl font-semibold">{problem.title}</h1>
        {problem.isSample ? (
          <p className="mt-3 text-sm text-amber-100">Sample brief for demonstration. Not an official problem statement.</p>
        ) : null}
        <p className="mt-4 max-w-3xl text-muted-foreground">{problem.summary}</p>
      </header>
      <Section title="Description" body={problem.description} />
      <Section title="Real-world problem" body={problem.realWorldProblem} />
      <ListSection title="Functional requirements" items={problem.functionalRequirements} />
      <ListSection title="Technical requirements" items={problem.technicalRequirements} />
      <ListSection title="Expected deliverables" items={problem.expectedDeliverables} />
      <ListSection title="Evaluation criteria" items={problem.evaluationCriteria} />
      <section>
        <h2 className="text-lg font-semibold">Assigned teams</h2>
        {teams.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No public teams are assigned.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {teams.map((team) => (
              <li key={team.id}>
                <Link href={`/teams/${team.id}`} className="text-sm hover:text-accent">
                  <span className="font-mono text-accent">{team.id}</span> {team.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{body}</p>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None listed.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
