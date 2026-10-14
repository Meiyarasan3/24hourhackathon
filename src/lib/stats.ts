import { isSubmittedStatus } from "@/lib/labels";
import type { EventStats, TeamRecord } from "@/lib/types";

export function computeStats(teams: TeamRecord[]): EventStats {
  const submittedProjects = teams.filter((team) =>
    isSubmittedStatus(team.submission?.status),
  ).length;

  return {
    totalTeams: teams.length,
    activeTeams: teams.filter((team) => team.progressStatus === "in_progress").length,
    submittedProjects,
    pendingSubmissions: teams.length - submittedProjects,
  };
}

export function assignmentCounts(teams: TeamRecord[]) {
  const counts = new Map<string, number>();
  for (const team of teams) {
    if (!team.assignment) continue;
    counts.set(team.assignment.problemId, (counts.get(team.assignment.problemId) ?? 0) + 1);
  }
  return counts;
}
