import { parseCsv } from "@/lib/csv";
import { ANNOUNCEMENT_CATEGORIES, PROGRESS_STATUSES } from "@/lib/types";
import type { AnnouncementCategory, ProgressStatus } from "@/lib/types";

const TEAM_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;
const PROBLEM_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;

export function isTeamId(value: string) {
  return TEAM_ID.test(value);
}

export function isProblemId(value: string) {
  return PROBLEM_ID.test(value);
}

export function parseProgress(value: string): ProgressStatus | null {
  return PROGRESS_STATUSES.includes(value as ProgressStatus) ? (value as ProgressStatus) : null;
}

export function parseCategory(value: string): AnnouncementCategory | null {
  return ANNOUNCEMENT_CATEGORIES.includes(value as AnnouncementCategory)
    ? (value as AnnouncementCategory)
    : null;
}

export function parseSubmissionUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true as const, url: null };
  if (trimmed.length > 2000) {
    return { ok: false as const, message: "Submission URL must be 2000 characters or fewer." };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false as const, message: "Enter a valid http or https URL, or leave the field empty." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false as const, message: "Submission URLs must start with http:// or https://." };
  }
  return { ok: true as const, url: url.toString() };
}

export type ImportRow = {
  row: number;
  teamId: string;
  teamName: string;
  memberCount: number;
  problemId: string | null;
};

export function validateImportCsv(text: string, knownProblemIds: Set<string>) {
  const table = parseCsv(text);
  const required = ["team_id", "team_name", "member_count", "problem_id"];
  const errors: { row: number; message: string }[] = [];
  const missing = required.filter((column) => !table.headers.includes(column));
  const unknown = table.headers.filter((column) => column && !required.includes(column));

  if (table.headers.length === 0 || table.headers.every((header) => !header)) {
    return { rows: [] as ImportRow[], errors: [{ row: 1, message: "The CSV file needs a header row." }] };
  }
  if (missing.length) {
    errors.push({ row: 1, message: `Missing required columns: ${missing.join(", ")}.` });
  }
  if (unknown.length) {
    errors.push({ row: 1, message: `Unexpected columns: ${unknown.join(", ")}.` });
  }
  if (errors.length) return { rows: [] as ImportRow[], errors };

  const seen = new Set<string>();
  const rows: ImportRow[] = [];

  for (const record of table.records) {
    const teamId = record.values.team_id;
    const teamName = record.values.team_name;
    const memberRaw = record.values.member_count;
    const problemId = record.values.problem_id;

    if (!isTeamId(teamId)) {
      errors.push({ row: record.row, message: "Team ID must be 1–32 letters, numbers, hyphens, or underscores." });
      continue;
    }
    if (seen.has(teamId.toLowerCase())) {
      errors.push({ row: record.row, message: `Duplicate team ID ${teamId} in this file.` });
      continue;
    }
    seen.add(teamId.toLowerCase());
    if (!teamName || teamName.length > 80) {
      errors.push({ row: record.row, message: "Team name is required and must be 80 characters or fewer." });
      continue;
    }
    if (!/^\d+$/.test(memberRaw) || Number(memberRaw) > 20) {
      errors.push({ row: record.row, message: "Member count must be a whole number from 0 to 20." });
      continue;
    }
    if (problemId && !knownProblemIds.has(problemId)) {
      errors.push({ row: record.row, message: `Unknown problem statement ID ${problemId}.` });
      continue;
    }
    rows.push({
      row: record.row,
      teamId,
      teamName,
      memberCount: Number(memberRaw),
      problemId: problemId || null,
    });
  }

  return { rows, errors };
}
