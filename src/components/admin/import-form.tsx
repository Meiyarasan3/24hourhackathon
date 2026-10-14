"use client";

import { useActionState } from "react";
import { importTeams } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/fields";
import type { ActionState } from "@/lib/types";

const initial: ActionState = { ok: false, message: "" };

export function ImportForm() {
  const [state, action, pending] = useActionState(importTeams, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="file">CSV file</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="mt-1 block w-full text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="update_existing" />
        Update names and member counts for teams that already exist
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="replace_assignments" />
        Replace an existing assignment when the problem statement differs
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Importing…" : "Validate and import"}
      </Button>
      {state.message ? (
        <p role="status" className="text-sm">
          {state.message}
        </p>
      ) : null}
      {state.errors?.length ? (
        <ul className="space-y-1 text-sm text-destructive">
          {state.errors.map((error) => (
            <li key={`${error.row}-${error.message}`}>
              Row {error.row}: {error.message}
            </li>
          ))}
        </ul>
      ) : null}
      {state.summary ? (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>Teams created: {state.summary.teamsCreated}</div>
          <div>Teams updated: {state.summary.teamsUpdated}</div>
          <div>Teams unchanged: {state.summary.teamsUnchanged}</div>
          <div>Assignments created: {state.summary.assignmentsCreated}</div>
          <div>Assignments replaced: {state.summary.assignmentsReplaced}</div>
          <div>Assignments unchanged: {state.summary.assignmentsUnchanged}</div>
        </dl>
      ) : null}
    </form>
  );
}
