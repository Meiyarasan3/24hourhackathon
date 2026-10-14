import type { ProgressStatus, TeamRecord } from "@/lib/types";

export function matchesTeam(
  team: TeamRecord,
  filters: { query: string; problem: string; progress: string; submission: string },
) {
  const haystack = `${team.id} ${team.name}`.toLowerCase();
  if (filters.query && !haystack.includes(filters.query.toLowerCase())) return false;
  if (filters.problem && team.assignment?.problemId !== filters.problem) return false;
  if (filters.progress && team.progressStatus !== filters.progress) return false;
  const submissionStatus = team.submission?.status ?? "not_started";
  if (filters.submission === "pending") {
    return !["submitted", "under_review", "evaluated"].includes(submissionStatus);
  }
  if (filters.submission === "handed_in") {
    return ["submitted", "under_review", "evaluated"].includes(submissionStatus);
  }
  if (filters.submission && submissionStatus !== (filters.submission as ProgressStatus)) return false;
  return true;
}
