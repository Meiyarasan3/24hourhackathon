import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="text-sm font-semibold tracking-[0.16em]">
        SYNAPSE 24
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Administrator login</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Only accounts with the admin role can manage teams, assignments, announcements, and submissions.
      </p>
      {isSupabaseConfigured() ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <LoginForm />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm">
          <p className="font-medium">Supabase is not configured</p>
          <p className="mt-2 text-muted-foreground">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, run the SQL migration, create a user, and set that profile role to admin. Login stays unavailable until then.
          </p>
        </div>
      )}
    </main>
  );
}
