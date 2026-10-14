export const PROGRESS_STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "evaluated",
] as const;

export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const ANNOUNCEMENT_CATEGORIES = [
  "general",
  "important",
  "schedule_update",
  "submission_reminder",
] as const;

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const STATUS_OVERRIDES = ["scheduled", "live", "paused", "ended"] as const;

export type StatusOverride = (typeof STATUS_OVERRIDES)[number];

export type DataSource = "database" | "demonstration";

export type EventSettings = {
  timezone: string;
  startAt: string | null;
  endAt: string | null;
  statusOverride: StatusOverride | null;
};

export type ProblemStatement = {
  id: string;
  title: string;
  summary: string;
  description: string;
  realWorldProblem: string;
  functionalRequirements: string[];
  technicalRequirements: string[];
  expectedDeliverables: string[];
  evaluationCriteria: string[];
  isSample: boolean;
  isPublished: boolean;
  updatedAt: string;
};

export type Team = {
  id: string;
  name: string;
  memberCount: number;
  progressStatus: ProgressStatus;
  isSample: boolean;
  isPublic: boolean;
  updatedAt: string;
};

export type Assignment = {
  teamId: string;
  problemId: string;
  updatedAt: string;
};

export type Submission = {
  teamId: string;
  status: ProgressStatus;
  submissionUrl: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  category: AnnouncementCategory;
  priority: number;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  sortOrder: number;
  isSample: boolean;
};

export type TeamRecord = Team & {
  assignment: Assignment | null;
  problem: ProblemStatement | null;
  submission: Submission | null;
  lastUpdated: string;
};

export type EventStats = {
  totalTeams: number;
  activeTeams: number;
  submittedProjects: number;
  pendingSubmissions: number;
};

export type PublicData = {
  source: DataSource;
  settings: EventSettings;
  teams: TeamRecord[];
  problems: ProblemStatement[];
  announcements: Announcement[];
  schedule: ScheduleItem[];
  serverNow: number;
};

export type ActionState = {
  ok: boolean;
  message: string;
  errors?: { row: number; message: string }[];
  summary?: {
    teamsCreated: number;
    teamsUpdated: number;
    teamsUnchanged: number;
    assignmentsCreated: number;
    assignmentsReplaced: number;
    assignmentsUnchanged: number;
  };
};
