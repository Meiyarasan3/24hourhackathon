import Link from "next/link";
import { Suspense } from "react";
import { DataBanner, EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Input, Label, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { getPublicData } from "@/lib/data";
import { formatInTimeZone, progressLabel } from "@/lib/labels";
import { matchesTeam } from "@/lib/team-query";
import { PROGRESS_STATUSES } from "@/lib/types";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "Teams" };

const PAGE_SIZE = 10;

export default function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading teams" />}>
      <TeamsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TeamsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const result = await getPublicData();
  if (!result.ok) return <ErrorState message={result.error} />;
  const query = firstParam(params.q)?.trim() ?? "";
  const problem = firstParam(params.problem) ?? "";
  const progress = firstParam(params.progress) ?? "";
  const submission = firstParam(params.submission) ?? "";
  const page = Math.max(1, Number(firstParam(params.page) ?? "1") || 1);

  const filtered = result.data.teams.filter((team) =>
    matchesTeam(team, { query, problem, progress, submission }),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const preserved = {
    ...(query ? { q: query } : {}),
    ...(problem ? { problem } : {}),
    ...(progress ? { progress } : {}),
    ...(submission ? { submission } : {}),
  };

  return (
    <div className="space-y-6">
      <DataBanner source={result.data.source} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Public team IDs, assignments, and status. Participant names are not shown.
        </p>
      </div>
      <form method="get" className="grid gap-3 rounded-2xl border border-border bg-card/60 p-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label htmlFor="q">Search team ID or name</Label>
          <Input id="q" name="q" defaultValue={query} placeholder="T-01 or team name" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="problem">Problem statement</Label>
          <Select id="problem" name="problem" defaultValue={problem} className="mt-1">
            <option value="">All problems</option>
            {result.data.problems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="progress">Progress</Label>
          <Select id="progress" name="progress" defaultValue={progress} className="mt-1">
            <option value="">Any progress</option>
            {PROGRESS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {progressLabel(status)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="submission">Submission</Label>
          <Select id="submission" name="submission" defaultValue={submission} className="mt-1">
            <option value="">Any submission</option>
            <option value="pending">Pending</option>
            <option value="handed_in">Handed in</option>
            {PROGRESS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {progressLabel(status)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit">Apply</Button>
          <Button asChild variant="outline">
            <Link href="/teams">Clear</Link>
          </Button>
        </div>
      </form>
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "team" : "teams"}
      </p>
      {visible.length === 0 ? (
        <EmptyState title="No teams match" body="Try another ID, name, or filter. If the directory is empty, organizers have not published teams yet." />
      ) : (
        <ul className="space-y-3">
          {visible.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="block rounded-2xl border border-border bg-card/80 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-accent">{team.id}</p>
                    <h2 className="mt-1 text-lg font-semibold">{team.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {team.memberCount} members · {team.problem ? team.problem.title : "No problem assigned"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={team.progressStatus} />
                    <StatusBadge status={team.submission?.status ?? "not_started"} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Updated {formatInTimeZone(team.lastUpdated, result.data.settings.timezone)}
                  {team.submission ? "" : " · No submission record"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={safePage} pageCount={pageCount} path="/teams" params={preserved} />
    </div>
  );
}
