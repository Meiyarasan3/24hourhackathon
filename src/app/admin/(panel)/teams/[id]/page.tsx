import { Suspense } from "react";
import { deleteTeam, saveTeam } from "@/app/admin/actions";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/fields";
import { getAdminBundle } from "@/lib/data";
import { progressLabel } from "@/lib/labels";
import { PROGRESS_STATUSES } from "@/lib/types";

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading team" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creating = id === "new";
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  const team = creating ? null : result.data.allTeams.find((item) => item.id === id);
  if (!creating && !team) return <ErrorState message="That team does not exist." />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">{creating ? "Add team" : `Edit ${team?.name}`}</h1>
      <form action={saveTeam} className="grid gap-4 rounded-2xl border border-border p-5">
        <div>
          <Label htmlFor="id">Team ID</Label>
          <Input id="id" name="id" defaultValue={team?.id ?? ""} required readOnly={!creating} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="name">Team name</Label>
          <Input id="name" name="name" defaultValue={team?.name ?? ""} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="member_count">Member count</Label>
          <Input id="member_count" name="member_count" type="number" min={0} max={20} defaultValue={team?.memberCount ?? 4} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="progress_status">Progress</Label>
          <Select id="progress_status" name="progress_status" defaultValue={team?.progressStatus ?? "not_started"} className="mt-1">
            {PROGRESS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {progressLabel(status)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="problem_id">Assigned problem statement</Label>
          <Select id="problem_id" name="problem_id" defaultValue={team?.assignment?.problemId ?? ""} className="mt-1">
            <option value="">Leave unchanged if this team already has one</option>
            {result.data.allProblems.map((problem) => (
              <option key={problem.id} value={problem.id}>
                {problem.id} — {problem.title}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="replace_assignment" />
          Replace the current assignment if it points at a different problem
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_public" defaultChecked={team?.isPublic ?? true} />
          Show this team on the public site
        </label>
        <Button type="submit">Save team</Button>
      </form>
      {team ? (
        <form action={deleteTeam} className="rounded-2xl border border-destructive/30 p-5">
          <input type="hidden" name="id" value={team.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm_delete" />
            Delete this team, its assignment, and its submission record
          </label>
          <Button type="submit" variant="outline" className="mt-4">
            Delete team
          </Button>
        </form>
      ) : null}
    </div>
  );
}
