import { ImportForm } from "@/components/admin/import-form";

export const metadata = { title: "CSV import" };

export default function ImportPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold">Import teams</h1>
      <p className="text-sm text-muted-foreground">
        Required columns: team_id, team_name, member_count, problem_id. Unknown columns, duplicate IDs, and unknown problem IDs stop the import. Existing assignments are kept unless you explicitly allow replacement.
      </p>
      <p className="text-sm">
        <a className="text-accent hover:underline" href="/templates/teams-import-template.csv">
          Download the header template
        </a>
      </p>
      <div className="rounded-2xl border border-border p-5">
        <ImportForm />
      </div>
    </div>
  );
}
