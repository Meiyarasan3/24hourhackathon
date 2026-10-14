import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function getAdminSession() {
  if (!isSupabaseConfigured()) {
    return { configured: false as const, user: null, role: null, supabase: null };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { configured: false as const, user: null, role: null, supabase: null };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true as const, user: null, role: null, supabase };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return {
    configured: true as const,
    user,
    role: (profile?.role as string | undefined) ?? null,
    supabase,
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.configured) return session;
  if (!session.user) redirect("/admin/login");
  return session;
}
