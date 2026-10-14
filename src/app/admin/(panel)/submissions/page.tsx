import { Suspense } from "react";
import { saveSubmission } from "@/app/admin/actions";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/fields";
import { getAdminBundle } from "@/lib/data";
import { progressLabel } from "@/lib/labels";
import { PROGRESS_STATUSES } from "@/lib/types";

export const metadata = { title: "Submissions" };

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading submissions" />}>
      <Submissions />
    </Suspense>
  );
}

async function Submissions() {
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Submissions</h1>
      <p className="text-sm text-muted-foreground">
        A project is handed in only when its submission record uses Submitted, Under Review, or Evaluated.
      </p>
      <ul className="space-y-4">
        {result.data.allTeams.map((team) => (
          <li key={team.id} className="rounded-2xl border border-border p-4">
            <p className="font-medium">
              <span className="font-mono text-xs text-accent">{team.id}</span> {team.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {team.submission ? "Record on file" : "No submission record"}
            </p>
            <form action={saveSubmission} className="mt-3 grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
              <input type="hidden" name="team_id" value={team.id} />
              <input type="hidden" name="return_to" value="/admin/submissions" />
              <div>
                <Label htmlFor={`status-${team.id}`}>Status</Label>
                <Select id={`status-${team.id}`} name="status" defaultValue={team.submission?.status ?? "not_started"}>
                  {PROGRESS_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {progressLabel(status)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor={`url-${team.id}`}>Submission URL</Label>
                <Input id={`url-${team.id}`} name="submission_url" type="url" defaultValue={team.submission?.submissionUrl ?? ""} placeholder="https://" />
              </div>
              <div className="flex items-end">
                <Button type="submit">Save</Button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
