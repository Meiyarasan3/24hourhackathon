import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  path,
  params,
}: {
  page: number;
  pageCount: number;
  path: string;
  params: Record<string, string>;
}) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number) => {
    const query = new URLSearchParams({ ...params, page: String(nextPage) });
    return `${path}?${query.toString()}`;
  };

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5">
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">Previous</span>
      )}
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5">
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">Next</span>
      )}
    </nav>
  );
}
