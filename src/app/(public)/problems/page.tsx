import Link from "next/link";
import { Suspense } from "react";
import { DataBanner, EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/fields";
import { getPublicData } from "@/lib/data";
import { assignmentCounts } from "@/lib/stats";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "Problem Statements" };

export default function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading problem statements" />}>
      <ProblemsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProblemsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;
  const query = firstParam(params.q)?.trim() ?? "";
  const assigned = firstParam(params.assigned) ?? "";
  const counts = assignmentCounts(result.data.teams);
  const problems = result.data.problems.filter((problem) => {
    const haystack = `${problem.id} ${problem.title} ${problem.summary}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    const count = counts.get(problem.id) ?? 0;
    if (assigned === "yes" && count === 0) return false;
    if (assigned === "no" && count > 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <DataBanner source={result.data.source} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Problem statements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Published briefs and the number of public teams assigned to each one.
        </p>
      </div>
      <form method="get" className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4 md:grid-cols-[1fr_220px_auto]">
        <div>
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={query} placeholder="ID, title, or summary" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="assigned">Assignment</Label>
          <Select id="assigned" name="assigned" defaultValue={assigned} className="mt-1">
            <option value="">All</option>
            <option value="yes">Has teams</option>
            <option value="no">Unassigned</option>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit">Apply</Button>
          <Button asChild variant="outline">
            <Link href="/problems">Clear</Link>
          </Button>
        </div>
      </form>
      {problems.length === 0 ? (
        <EmptyState title="No problem statements" body="Nothing published matches this search. Official briefs appear after organizers publish them." />
      ) : (
        <ul className="space-y-3">
          {problems.map((problem) => (
            <li key={problem.id}>
              <Link href={`/problems/${problem.id}`} className="block rounded-2xl border border-border bg-card/80 p-5 hover:border-primary/40">
                <p className="font-mono text-xs text-accent">{problem.id}</p>
                <h2 className="mt-1 text-xl font-semibold">{problem.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{problem.summary}</p>
                <p className="mt-3 text-sm">{counts.get(problem.id) ?? 0} assigned teams</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
