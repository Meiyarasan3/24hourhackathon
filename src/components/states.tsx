import type { DataSource } from "@/lib/types";

export function DataBanner({ source }: { source: DataSource }) {
  if (source === "database") return null;
  return (
    <div className="border-b border-amber-300/20 bg-amber-300/10">
      <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-amber-100">
        Demonstration data. Supabase is not configured, so these teams, briefs, announcements, and times are samples — not official event records.
      </p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6" role="alert">
      <h2 className="text-lg font-semibold">Unable to load this page</h2>
      <p className="mt-2 text-sm text-foreground/90">{message}</p>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="h-28 animate-pulse rounded-2xl border border-border bg-card/50" />
      <div className="h-28 animate-pulse rounded-2xl border border-border bg-card/50" />
    </div>
  );
}
