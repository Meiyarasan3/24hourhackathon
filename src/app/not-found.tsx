import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-24">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold">That page is not available</h1>
      <p className="mt-3 text-sm text-muted-foreground">The team, problem statement, or route could not be found.</p>
      <Link href="/" className="mt-6 text-sm text-accent hover:underline">
        Back to SYNAPSE 24
      </Link>
    </div>
  );
}
