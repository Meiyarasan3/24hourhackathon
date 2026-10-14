"use client";

import { useSearchParams } from "next/navigation";

export function QueryNotice() {
  const params = useSearchParams();
  const notice = params.get("notice");
  const error = params.get("error");
  if (!notice && !error) return null;
  return (
    <p
      role="status"
      className={
        error
          ? "rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
          : "rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm"
      }
    >
      {error ?? notice}
    </p>
  );
}
