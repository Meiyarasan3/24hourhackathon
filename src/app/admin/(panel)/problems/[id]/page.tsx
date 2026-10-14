import { Suspense } from "react";
import { deleteProblem, saveProblem } from "@/app/admin/actions";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { getAdminBundle } from "@/lib/data";

export default function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading problem statement" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creating = id === "new";
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  const problem = creating ? null : result.data.allProblems.find((item) => item.id === id);
  if (!creating && !problem) return <ErrorState message="That problem statement does not exist." />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">{creating ? "Add problem statement" : problem?.title}</h1>
      <form action={saveProblem} className="grid gap-4">
        <Field label="ID" name="id" defaultValue={problem?.id ?? ""} readOnly={!creating} />
        <Field label="Title" name="title" defaultValue={problem?.title ?? ""} />
        <Area label="Summary" name="summary" defaultValue={problem?.summary ?? ""} />
        <Area label="Description" name="description" defaultValue={problem?.description ?? ""} />
        <Area label="Real-world problem" name="real_world_problem" defaultValue={problem?.realWorldProblem ?? ""} />
        <Area label="Functional requirements (one per line)" name="functional_requirements" defaultValue={problem?.functionalRequirements.join("\n") ?? ""} />
        <Area label="Technical requirements (one per line)" name="technical_requirements" defaultValue={problem?.technicalRequirements.join("\n") ?? ""} />
        <Area label="Expected deliverables (one per line)" name="expected_deliverables" defaultValue={problem?.expectedDeliverables.join("\n") ?? ""} />
        <Area label="Evaluation criteria (one per line)" name="evaluation_criteria" defaultValue={problem?.evaluationCriteria.join("\n") ?? ""} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={problem?.isPublished ?? false} />
          Publish on the public site
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_sample" defaultChecked={problem?.isSample ?? false} />
          Mark as sample content
        </label>
        <Button type="submit">Save problem statement</Button>
      </form>
      {problem ? (
        <form action={deleteProblem} className="rounded-2xl border border-destructive/30 p-5">
          <input type="hidden" name="id" value={problem.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm_delete" />
            Delete this problem statement after teams are unassigned
          </label>
          <Button type="submit" variant="outline" className="mt-4">
            Delete
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function Field({ label, name, defaultValue, readOnly = false }: { label: string; name: string; defaultValue: string; readOnly?: boolean }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required readOnly={readOnly} className="mt-1" />
    </div>
  );
}

function Area({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} className="mt-1" />
    </div>
  );
}
