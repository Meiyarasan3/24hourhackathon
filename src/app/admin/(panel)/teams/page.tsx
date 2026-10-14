import Link from "next/link";
import { Suspense } from "react";
import { ErrorState, LoadingBlock } from "@/components/states";
import { getAdminBundle } from "@/lib/data";
import { progressLabel } from "@/lib/labels";

export const metadata = { title: "Manage teams" };

export default function AdminTeamsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading teams" />}>
      <Teams />
    </Suspense>
  );
}

async function Teams() {
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Teams</h1>
        <Link href="/admin/teams/new" className="rounded-lg bg-primary px-3 py-2 text-sm">
          Add team
        </Link>
      </div>
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {result.data.allTeams.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">No teams have been added.</li>
        ) : (
          result.data.allTeams.map((team) => (
            <li key={team.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-xs text-accent">{team.id}</p>
                <p className="font-medium">{team.name}</p>
                <p className="text-sm text-muted-foreground">
                  {team.problem?.id ?? "Unassigned"} · {progressLabel(team.progressStatus)} · {team.isPublic ? "Public" : "Hidden"}
                </p>
              </div>
              <Link href={`/admin/teams/${team.id}`} className="text-sm text-accent hover:underline">
                Edit
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
