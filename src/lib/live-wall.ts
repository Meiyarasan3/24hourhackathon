import type { PublicData } from "@/lib/types";

export const OFFICIAL_TIME_ZONE = "Asia/Kolkata";
export const OFFICIAL_START = "2026-10-15T09:00:00+05:30";
export const OFFICIAL_END = "2026-10-16T09:00:00+05:30";
export const OFFICIAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export const PROBLEMS_PER_SCENE = 4;

export type WallScene =
  | { kind: "overview" }
  | { kind: "teams" }
  | { kind: "problems"; page: number }
  | { kind: "announcements" };

export function buildWallScenes(problemCount: number): WallScene[] {
  const pages = Math.max(1, Math.ceil(problemCount / PROBLEMS_PER_SCENE));
  const scenes: WallScene[] = [{ kind: "overview" }, { kind: "teams" }];
  for (let page = 0; page < pages; page += 1) scenes.push({ kind: "problems", page });
  scenes.push({ kind: "announcements" });
  return scenes;
}

export function hideSubmissionUrls(data: PublicData): PublicData {
  return {
    ...data,
    teams: data.teams.map((team) =>
      team.submission ? { ...team, submission: { ...team.submission, submissionUrl: null } } : team,
    ),
  };
}

export const WALL_ROW_PX = 112;
export const WALL_STAGE_MIN_PX = 760;

export function wallHalf<T>(items: T[], stageMin = WALL_STAGE_MIN_PX, row = WALL_ROW_PX) {
  if (items.length === 0) return [];
  const copies = Math.max(1, Math.ceil(stageMin / (items.length * row)));
  const half: T[] = [];
  for (let copy = 0; copy < copies; copy += 1) half.push(...items);
  return half;
}
