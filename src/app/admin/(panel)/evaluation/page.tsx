export const metadata = { title: "Evaluation" };

export default function EvaluationPage() {
  return (
    <div className="max-w-2xl space-y-3">
      <h1 className="text-3xl font-semibold">Evaluation</h1>
      <p className="text-sm text-muted-foreground">
        Judge scoring is disabled. No scores, feedback, or rankings are collected, and this screen cannot finalize a result.
      </p>
      <p className="text-sm text-muted-foreground">
        The database includes unused evaluation tables so organizers can add judge access later. Official criteria and judges have not been configured.
      </p>
    </div>
  );
}
