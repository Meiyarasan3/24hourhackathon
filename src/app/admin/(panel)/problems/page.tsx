import Link from "next/link";
import { Suspense } from "react";
import { ErrorState, LoadingBlock } from "@/components/states";
import { getAdminBundle } from "@/lib/data";

export const metadata = { title: "Manage problems" };

export default function AdminProblemsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading problem statements" />}>
      <Problems />
    </Suspense>
  );
}

async function Problems() {
  const result = await getAdminBundle();
  if (!result.ok) return <ErrorState message={result.error} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Problem statements</h1>
        <Link href="/admin/problems/new" className="rounded-lg bg-primary px-3 py-2 text-sm">
          Add problem
        </Link>
      </div>
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {result.data.allProblems.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">No problem statements yet.</li>
        ) : (
          result.data.allProblems.map((problem) => (
            <li key={problem.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-xs text-accent">{problem.id}</p>
                <p className="font-medium">{problem.title}</p>
                <p className="text-sm text-muted-foreground">{problem.isPublished ? "Published" : "Draft"}</p>
              </div>
              <Link href={`/admin/problems/${problem.id}`} className="text-sm text-accent hover:underline">
                Edit
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
