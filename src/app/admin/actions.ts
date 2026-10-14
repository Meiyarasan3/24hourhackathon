"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { hasExplicitOffset, isValidTimeZone, parseEventInstant } from "@/lib/countdown";
import { OFFICIAL_END, OFFICIAL_START, OFFICIAL_TIME_ZONE, OFFICIAL_WINDOW_MS } from "@/lib/live-wall";
import { validateImportCsv, isProblemId, isTeamId, parseCategory, parseProgress, parseSubmissionUrl } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

async function adminClient() {
  const session = await getAdminSession();
  if (!session.configured || !session.supabase) {
    return { supabase: null, userId: null, error: "Supabase is not configured." };
  }
  if (!session.user) redirect("/admin/login");
  if (session.role !== "admin") {
    return { supabase: null, userId: null, error: "This account is not authorized to administer SYNAPSE 24." };
  }
  return { supabase: session.supabase, userId: session.user.id, error: null };
}

function bounce(path: string, key: "notice" | "error", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session.configured || !session.supabase) {
    return { ok: false, message: "Supabase is not configured. Add the environment variables before signing in." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Email and password are required." };

  const { error } = await session.supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: "Sign-in failed. Check the email and password." };

  const {
    data: { user },
  } = await session.supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign-in did not return a session." };

  const { data: profile } = await session.supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    await session.supabase.auth.signOut();
    return { ok: false, message: "This account is not authorized to administer SYNAPSE 24." };
  }
  redirect("/admin");
}

export async function signOut() {
  const session = await getAdminSession();
  if (session.supabase) await session.supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveSettings(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/settings", "error", gate.error ?? "Unauthorized");
  const timezone = String(formData.get("timezone") ?? "").trim();
  const startAt = String(formData.get("start_at") ?? "").trim();
  const endAt = String(formData.get("end_at") ?? "").trim();
  const override = String(formData.get("status_override") ?? "");

  if (timezone !== OFFICIAL_TIME_ZONE || !isValidTimeZone(timezone)) {
    bounce("/admin/settings", "error", "The official event time zone is Asia/Kolkata.");
  }
  const start = parseEventInstant(startAt || null);
  const end = parseEventInstant(endAt || null);
  if (!start.ok || !hasExplicitOffset(startAt)) {
    bounce("/admin/settings", "error", `Start time must include an offset, for example ${OFFICIAL_START}.`);
  }
  if (endAt && !end.ok) {
    bounce("/admin/settings", "error", "End time must be an ISO timestamp with an offset.");
  }
  if (end.ok && end.ms !== start.ms + OFFICIAL_WINDOW_MS) {
    bounce("/admin/settings", "error", `The end time must be exactly 24 hours after the start. The official window is ${OFFICIAL_START} to ${OFFICIAL_END}.`);
  }
  const endToSave = end.ok ? endAt : new Date(start.ms + OFFICIAL_WINDOW_MS).toISOString();
  if (override && !["scheduled", "live", "paused", "ended"].includes(override)) {
    bounce("/admin/settings", "error", "Unknown status override.");
  }

  const { error } = await gate.supabase.from("event_settings").upsert({
    id: 1,
    timezone,
    start_at: startAt,
    end_at: endToSave,
    status_override: override || null,
  });
  if (error) bounce("/admin/settings", "error", "The event clock could not be saved.");
  refresh();
  bounce("/admin/settings", "notice", "Event clock saved.");
}

export async function saveTeam(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/teams", "error", gate.error ?? "Unauthorized");
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const memberCount = Number(formData.get("member_count"));
  const progress = parseProgress(String(formData.get("progress_status") ?? ""));
  const problemId = String(formData.get("problem_id") ?? "").trim();
  const replace = formData.get("replace_assignment") === "on";
  const isPublic = formData.get("is_public") === "on";
  const back = `/admin/teams/${encodeURIComponent(id)}`;

  if (!isTeamId(id) || !name || name.length > 80 || !Number.isInteger(memberCount) || memberCount < 0 || memberCount > 20 || !progress) {
    bounce("/admin/teams", "error", "Check the team ID, name, member count, and progress status.");
  }

  const { error } = await gate.supabase.from("teams").upsert({
    id,
    name,
    member_count: memberCount,
    progress_status: progress,
    is_public: isPublic,
    is_sample: false,
  });
  if (error) bounce("/admin/teams", "error", "The team could not be saved.");

  if (problemId) {
    if (!isProblemId(problemId)) bounce(back, "error", "The problem statement ID is not valid.");
    const { data: existing } = await gate.supabase.from("team_assignments").select("problem_id").eq("team_id", id).maybeSingle();
    if (existing && existing.problem_id !== problemId && !replace) {
      bounce(back, "error", "This team already has a different assignment. Confirm replacement to change it.");
    }
    const { error: assignError } = await gate.supabase.from("team_assignments").upsert({
      team_id: id,
      problem_id: problemId,
    });
    if (assignError) bounce(back, "error", "The assignment could not be saved. Check that the problem statement exists.");
  }

  refresh();
  bounce(back, "notice", "Team saved.");
}

export async function deleteTeam(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/teams", "error", gate.error ?? "Unauthorized");
  if (formData.get("confirm_delete") !== "on") bounce("/admin/teams", "error", "Confirm deletion before removing a team.");
  const id = String(formData.get("id") ?? "");
  const { error } = await gate.supabase.from("teams").delete().eq("id", id);
  if (error) bounce("/admin/teams", "error", "The team could not be deleted.");
  refresh();
  bounce("/admin/teams", "notice", "Team deleted.");
}

export async function saveProblem(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/problems", "error", gate.error ?? "Unauthorized");
  const id = String(formData.get("id") ?? "").trim();
  const back = `/admin/problems/${encodeURIComponent(id)}`;
  if (!isProblemId(id)) bounce("/admin/problems", "error", "Problem IDs must be 1–32 letters, numbers, hyphens, or underscores.");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!title || title.length > 160 || !summary || summary.length > 400) {
    bounce(back, "error", "Title and summary are required within their length limits.");
  }
  const { error } = await gate.supabase.from("problem_statements").upsert({
    id,
    title,
    summary,
    description: String(formData.get("description") ?? "").trim(),
    real_world_problem: String(formData.get("real_world_problem") ?? "").trim(),
    functional_requirements: lines(formData.get("functional_requirements")),
    technical_requirements: lines(formData.get("technical_requirements")),
    expected_deliverables: lines(formData.get("expected_deliverables")),
    evaluation_criteria: lines(formData.get("evaluation_criteria")),
    is_published: formData.get("is_published") === "on",
    is_sample: formData.get("is_sample") === "on",
  });
  if (error) bounce("/admin/problems", "error", "The problem statement could not be saved.");
  refresh();
  bounce(back, "notice", "Problem statement saved.");
}

export async function deleteProblem(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/problems", "error", gate.error ?? "Unauthorized");
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm_delete") !== "on") bounce(`/admin/problems/${id}`, "error", "Confirm deletion first.");
  const { count } = await gate.supabase.from("team_assignments").select("team_id", { count: "exact", head: true }).eq("problem_id", id);
  if (count) bounce(`/admin/problems/${id}`, "error", "Unassign teams before deleting this problem statement.");
  const { error } = await gate.supabase.from("problem_statements").delete().eq("id", id);
  if (error) bounce("/admin/problems", "error", "The problem statement could not be deleted.");
  refresh();
  bounce("/admin/problems", "notice", "Problem statement deleted.");
}

export async function saveAnnouncement(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/announcements", "error", gate.error ?? "Unauthorized");
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const category = parseCategory(String(formData.get("category") ?? ""));
  const priority = Number(formData.get("priority"));
  const id = String(formData.get("id") ?? "").trim();
  const publish = formData.get("is_published") === "on";
  if (!title || title.length > 140 || !message || message.length > 4000 || !category || !Number.isInteger(priority) || priority < 0 || priority > 3) {
    bounce("/admin/announcements", "error", "Check the title, message, category, and priority.");
  }
  let publishedAt: string | null = null;
  if (publish) {
    if (id) {
      const { data: existing } = await gate.supabase
        .from("announcements")
        .select("published_at")
        .eq("id", id)
        .maybeSingle();
      publishedAt = existing?.published_at ?? new Date().toISOString();
    } else {
      publishedAt = new Date().toISOString();
    }
  }
  const payload = {
    title,
    message,
    category,
    priority,
    is_published: publish,
    published_at: publishedAt,
  };
  const query = id
    ? gate.supabase.from("announcements").update(payload).eq("id", id)
    : gate.supabase.from("announcements").insert(payload);
  const { error } = await query;
  if (error) bounce("/admin/announcements", "error", "The announcement could not be saved.");
  refresh();
  bounce("/admin/announcements", "notice", publish ? "Announcement published." : "Announcement saved as a draft.");
}

export async function deleteAnnouncement(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/announcements", "error", gate.error ?? "Unauthorized");
  const id = String(formData.get("id") ?? "");
  const { error } = await gate.supabase.from("announcements").delete().eq("id", id);
  if (error) bounce("/admin/announcements", "error", "The announcement could not be deleted.");
  refresh();
  bounce("/admin/announcements", "notice", "Announcement deleted.");
}

export async function saveSubmission(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/submissions", "error", gate.error ?? "Unauthorized");
  const teamId = String(formData.get("team_id") ?? "").trim();
  const status = parseProgress(String(formData.get("status") ?? ""));
  const parsedUrl = parseSubmissionUrl(String(formData.get("submission_url") ?? ""));
  const returnTo = String(formData.get("return_to") ?? "/admin/submissions");
  const safeReturn = returnTo.startsWith("/admin/") ? returnTo : "/admin/submissions";
  if (!isTeamId(teamId) || !status) bounce(safeReturn, "error", "Choose a valid team and status.");
  if (!parsedUrl.ok) bounce(safeReturn, "error", parsedUrl.message);

  const { data: existing } = await gate.supabase.from("submissions").select("submitted_at").eq("team_id", teamId).maybeSingle();
  const handedIn = status === "submitted" || status === "under_review" || status === "evaluated";
  const { error } = await gate.supabase.from("submissions").upsert({
    team_id: teamId,
    status,
    submission_url: parsedUrl.url,
    submitted_at: handedIn ? existing?.submitted_at ?? new Date().toISOString() : existing?.submitted_at ?? null,
    updated_by: gate.userId,
  });
  if (error) bounce(safeReturn, "error", "The submission could not be saved.");
  refresh();
  bounce(safeReturn, "notice", "Submission status saved.");
}

export async function saveSchedule(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/schedule", "error", gate.error ?? "Unauthorized");
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const id = String(formData.get("id") ?? "").trim();
  if (!title || !parseEventInstant(startsAt).ok) {
    bounce("/admin/schedule", "error", "A title and a start timestamp with an offset are required.");
  }
  if (endsAt && !parseEventInstant(endsAt).ok) bounce("/admin/schedule", "error", "The end timestamp needs an explicit offset.");
  const payload = {
    title,
    description: String(formData.get("description") ?? "").trim(),
    starts_at: startsAt,
    ends_at: endsAt || null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_sample: false,
  };
  const query = id
    ? gate.supabase.from("schedule_items").update(payload).eq("id", id)
    : gate.supabase.from("schedule_items").insert(payload);
  const { error } = await query;
  if (error) bounce("/admin/schedule", "error", "The milestone could not be saved.");
  refresh();
  bounce("/admin/schedule", "notice", "Milestone saved.");
}

export async function deleteSchedule(formData: FormData) {
  const gate = await adminClient();
  if (!gate.supabase) bounce("/admin/schedule", "error", gate.error ?? "Unauthorized");
  const { error } = await gate.supabase.from("schedule_items").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) bounce("/admin/schedule", "error", "The milestone could not be deleted.");
  refresh();
  bounce("/admin/schedule", "notice", "Milestone deleted.");
}

export async function importTeams(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await adminClient();
  if (!gate.supabase) return { ok: false, message: gate.error ?? "Unauthorized" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a CSV file." };
  if (file.size > 1_000_000) return { ok: false, message: "CSV files must be 1 MB or smaller." };
  const text = await file.text();
  const { data: problems, error: problemError } = await gate.supabase.from("problem_statements").select("id");
  if (problemError) return { ok: false, message: "Problem statements could not be loaded for validation." };
  const known = new Set((problems ?? []).map((problem) => String(problem.id)));
  const validated = validateImportCsv(text, known);
  if (validated.errors.length) {
    return { ok: false, message: "The file has errors. Nothing was imported.", errors: validated.errors };
  }
  if (!validated.rows.length) return { ok: false, message: "The file has headers but no team rows." };

  const { data, error } = await gate.supabase.rpc("import_team_rows", {
    payload: validated.rows,
    update_existing: formData.get("update_existing") === "on",
    replace_assignments: formData.get("replace_assignments") === "on",
  });
  if (error) return { ok: false, message: "Import failed. Existing assignments were not changed." };
  const result = data as {
    applied?: boolean;
    errors?: { row: number; message: string }[];
    summary?: ActionState["summary"];
  };
  if (!result?.applied) {
    return { ok: false, message: "The database rejected the file. Nothing was imported.", errors: result?.errors ?? [] };
  }
  refresh();
  return { ok: true, message: "Import applied.", summary: result.summary };
}
