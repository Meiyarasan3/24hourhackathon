import type { AnnouncementCategory, ProgressStatus, StatusOverride } from "@/lib/types";

const progressLabels: Record<ProgressStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  evaluated: "Evaluated",
};

const categoryLabels: Record<AnnouncementCategory, string> = {
  general: "General",
  important: "Important",
  schedule_update: "Schedule Update",
  submission_reminder: "Submission Reminder",
};

const overrideLabels: Record<StatusOverride, string> = {
  scheduled: "Scheduled",
  live: "Live",
  paused: "Paused",
  ended: "Ended",
};

export function progressLabel(status: ProgressStatus) {
  return progressLabels[status];
}

export function categoryLabel(category: AnnouncementCategory) {
  return categoryLabels[category];
}

export function overrideLabel(status: StatusOverride) {
  return overrideLabels[status];
}

export function formatInTimeZone(iso: string | null, timeZone: string) {
  if (!iso) return "Not set";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid time";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return `${date.toISOString()} (time zone unavailable)`;
  }
}

const SUBMITTED = new Set<ProgressStatus>(["submitted", "under_review", "evaluated"]);

export function isSubmittedStatus(status: ProgressStatus | null | undefined) {
  return status ? SUBMITTED.has(status) : false;
}
