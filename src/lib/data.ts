import "server-only";

import { connection } from "next/server";
import {
  demoAnnouncements,
  demoAssignments,
  demoProblems,
  demoSchedule,
  demoSettings,
  demoSubmissions,
  demoTeams,
} from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  Announcement,
  AnnouncementCategory,
  Assignment,
  EventSettings,
  ProblemStatement,
  ProgressStatus,
  PublicData,
  ScheduleItem,
  StatusOverride,
  Submission,
  Team,
  TeamRecord,
} from "@/lib/types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(error: unknown, fallback: string): Result<never> {
  console.error(error);
  const message = error instanceof Error ? error.message : "";
  if (/does not exist|schema cache|relation/i.test(message)) {
    return {
      ok: false,
      error: "The database schema is not installed yet. Run the SQL migration, then reload this page.",
    };
  }
  return { ok: false, error: fallback };
}

function assemble(
  teams: Team[],
  problems: ProblemStatement[],
  assignments: Assignment[],
  submissions: Submission[],
): TeamRecord[] {
  const problemsById = new Map(problems.map((problem) => [problem.id, problem]));
  const assignmentByTeam = new Map(assignments.map((assignment) => [assignment.teamId, assignment]));
  const submissionByTeam = new Map(submissions.map((submission) => [submission.teamId, submission]));

  return teams
    .map((team) => {
      const assignment = assignmentByTeam.get(team.id) ?? null;
      const submission = submissionByTeam.get(team.id) ?? null;
      const times = [team.updatedAt, assignment?.updatedAt, submission?.updatedAt].filter(
        (value): value is string => Boolean(value),
      );
      const lastUpdated = times.sort().at(-1) ?? team.updatedAt;
      return {
        ...team,
        assignment,
        problem: assignment ? (problemsById.get(assignment.problemId) ?? null) : null,
        submission,
        lastUpdated,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getPublicData(): Promise<Result<PublicData>> {
  await connection();
  const serverNow = Date.now();

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      data: {
        source: "demonstration",
        settings: demoSettings,
        teams: assemble(demoTeams, demoProblems, demoAssignments, demoSubmissions),
        problems: demoProblems.filter((problem) => problem.isPublished),
        announcements: demoAnnouncements.filter((item) => item.isPublished),
        schedule: demoSchedule,
        serverNow,
      },
    };
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return { ok: false, error: "Supabase is not configured." };
    }

    const [settingsRes, teamsRes, problemsRes, assignmentsRes, submissionsRes, announcementsRes, scheduleRes] =
      await Promise.all([
        supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("teams").select("*").eq("is_public", true).order("id"),
        supabase.from("problem_statements").select("*").eq("is_published", true).order("id"),
        supabase.from("team_assignments").select("team_id, problem_id, updated_at"),
        supabase.from("submissions").select("team_id, status, submitted_at, updated_at"),
        supabase
          .from("announcements")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false }),
        supabase.from("schedule_items").select("*").order("sort_order").order("starts_at"),
      ]);

    const firstError = [
      settingsRes.error,
      teamsRes.error,
      problemsRes.error,
      assignmentsRes.error,
      submissionsRes.error,
      announcementsRes.error,
      scheduleRes.error,
    ].find(Boolean);
    if (firstError) return fail(firstError, "The event data could not be loaded.");

    const settings = mapSettings(settingsRes.data);
    const problems = (problemsRes.data ?? []).map(mapProblem);
    const teams = (teamsRes.data ?? []).map(mapTeam);
    const assignments = (assignmentsRes.data ?? []).map(mapAssignment);
    const publicTeamIds = new Set(teams.map((team) => team.id));
    const submissions = (submissionsRes.data ?? [])
      .map(mapSubmission)
      .filter((submission) => publicTeamIds.has(submission.teamId));

    return {
      ok: true,
      data: {
        source: "database",
        settings,
        teams: assemble(teams, problems, assignments, submissions),
        problems,
        announcements: (announcementsRes.data ?? []).map(mapAnnouncement),
        schedule: (scheduleRes.data ?? []).map(mapSchedule),
        serverNow,
      },
    };
  } catch (error) {
    return fail(error, "The event data could not be loaded.");
  }
}

export async function getAdminBundle(): Promise<
  Result<
    PublicData & {
      allTeams: TeamRecord[];
      allProblems: ProblemStatement[];
      allAnnouncements: Announcement[];
    }
  >
> {
  await connection();
  const serverNow = Date.now();
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  try {
    const [settingsRes, teamsRes, problemsRes, assignmentsRes, submissionsRes, announcementsRes, scheduleRes] =
      await Promise.all([
        supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("teams").select("*").order("id"),
        supabase.from("problem_statements").select("*").order("id"),
        supabase.from("team_assignments").select("team_id, problem_id, updated_at"),
        supabase.from("submissions").select("team_id, status, submission_url, submitted_at, updated_at"),
        supabase.from("announcements").select("*").order("updated_at", { ascending: false }),
        supabase.from("schedule_items").select("*").order("sort_order").order("starts_at"),
      ]);

    const firstError = [
      settingsRes.error,
      teamsRes.error,
      problemsRes.error,
      assignmentsRes.error,
      submissionsRes.error,
      announcementsRes.error,
      scheduleRes.error,
    ].find(Boolean);
    if (firstError) return fail(firstError, "Administrator data could not be loaded.");

    const problems = (problemsRes.data ?? []).map(mapProblem);
    const publishedProblems = problems.filter((problem) => problem.isPublished);
    const teams = (teamsRes.data ?? []).map(mapTeam);
    const publicTeams = teams.filter((team) => team.isPublic);
    const assignments = (assignmentsRes.data ?? []).map(mapAssignment);
    const submissions = (submissionsRes.data ?? []).map(mapSubmission);
    const announcements = (announcementsRes.data ?? []).map(mapAnnouncement);
    const schedule = (scheduleRes.data ?? []).map(mapSchedule);

    return {
      ok: true,
      data: {
        source: "database",
        settings: mapSettings(settingsRes.data),
        teams: assemble(publicTeams, problems, assignments, submissions),
        problems: publishedProblems,
        announcements: announcements.filter((item) => item.isPublished),
        schedule,
        serverNow,
        allTeams: assemble(teams, problems, assignments, submissions),
        allProblems: problems,
        allAnnouncements: announcements,
      },
    };
  } catch (error) {
    return fail(error, "Administrator data could not be loaded.");
  }
}

function mapSettings(row: Record<string, unknown> | null): EventSettings {
  if (!row) {
    return { timezone: "Asia/Kolkata", startAt: null, endAt: null, statusOverride: null };
  }
  return {
    timezone: String(row.timezone || "Asia/Kolkata"),
    startAt: (row.start_at as string | null) ?? null,
    endAt: (row.end_at as string | null) ?? null,
    statusOverride: (row.status_override as StatusOverride | null) ?? null,
  };
}

function mapTeam(row: Record<string, unknown>): Team {
  return {
    id: String(row.id),
    name: String(row.name),
    memberCount: Number(row.member_count),
    progressStatus: row.progress_status as ProgressStatus,
    isSample: Boolean(row.is_sample),
    isPublic: Boolean(row.is_public),
    updatedAt: String(row.updated_at),
  };
}

function mapProblem(row: Record<string, unknown>): ProblemStatement {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    description: String(row.description),
    realWorldProblem: String(row.real_world_problem),
    functionalRequirements: asList(row.functional_requirements),
    technicalRequirements: asList(row.technical_requirements),
    expectedDeliverables: asList(row.expected_deliverables),
    evaluationCriteria: asList(row.evaluation_criteria),
    isSample: Boolean(row.is_sample),
    isPublished: Boolean(row.is_published),
    updatedAt: String(row.updated_at),
  };
}

function mapAssignment(row: Record<string, unknown>): Assignment {
  return {
    teamId: String(row.team_id),
    problemId: String(row.problem_id),
    updatedAt: String(row.updated_at),
  };
}

function mapSubmission(row: Record<string, unknown>): Submission {
  return {
    teamId: String(row.team_id),
    status: row.status as ProgressStatus,
    submissionUrl: (row.submission_url as string | null) ?? null,
    submittedAt: (row.submitted_at as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    title: String(row.title),
    message: String(row.message),
    category: row.category as AnnouncementCategory,
    priority: Number(row.priority),
    isPublished: Boolean(row.is_published),
    publishedAt: (row.published_at as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

function mapSchedule(row: Record<string, unknown>): ScheduleItem {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ""),
    startsAt: String(row.starts_at),
    endsAt: (row.ends_at as string | null) ?? null,
    sortOrder: Number(row.sort_order),
    isSample: Boolean(row.is_sample),
  };
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}
