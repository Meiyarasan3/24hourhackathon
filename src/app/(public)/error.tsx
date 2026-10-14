"use client";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/40 p-6" role="alert">
      <h1 className="text-xl font-semibold">This page failed to load</h1>
      <p className="mt-2 text-sm text-muted-foreground">Try again. If it keeps failing, the database may be unavailable.</p>
      <button type="button" onClick={reset} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm">
        Try again
      </button>
    </div>
  );
}
