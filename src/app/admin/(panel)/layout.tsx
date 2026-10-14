import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { QueryNotice } from "@/components/admin/query-notice";
import { requireAdmin } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/problems", label: "Problems" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/settings", label: "Event clock" },
  { href: "/admin/import", label: "CSV import" },
  { href: "/admin/evaluation", label: "Evaluation" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Checking administrator access…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  if (!session.configured) redirect("/admin/login");
  if (session.role !== "admin") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">Administrator access required</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You are signed in, but this account is not an administrator. Ask an organizer to set your profile role in Supabase, then sign in again.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold tracking-[0.16em]">
            SYNAPSE 24
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Administration" className="flex flex-wrap gap-2 lg:flex-col">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-4">
          <Suspense fallback={null}>
            <QueryNotice />
          </Suspense>
          {children}
        </div>
      </div>
    </div>
  );
}
