import type {
  Announcement,
  Assignment,
  EventSettings,
  ProblemStatement,
  ScheduleItem,
  Submission,
  Team,
} from "@/lib/types";

const stamp = "2026-10-14T12:00:00+05:30";

export const demoSettings: EventSettings = {
  timezone: "Asia/Kolkata",
  startAt: "2026-10-15T09:00:00+05:30",
  endAt: "2026-10-16T09:00:00+05:30",
  statusOverride: null,
};

export const demoProblems: ProblemStatement[] = [
  {
    id: "PS-SAMPLE-01",
    title: "Sample: Campus operations board",
    summary: "Demonstration brief for a live operations board. This is not an official SYNAPSE 24 problem.",
    description:
      "Build a demonstration operations board that helps a campus club see what is happening during a one-day event. This record exists so the website can be reviewed before organizers publish official briefs.",
    realWorldProblem:
      "Volunteer organizers often track requests in scattered chats, so status is hard to see in one place.",
    functionalRequirements: [
      "Show a list of open requests with a status.",
      "Let a coordinator update a request status.",
      "Show the time a request was last updated.",
    ],
    technicalRequirements: [
      "Use a relational data model.",
      "Validate status changes.",
      "Keep the interface usable on a phone.",
    ],
    expectedDeliverables: [
      "Working prototype",
      "Short architecture note",
      "Demo script",
    ],
    evaluationCriteria: [
      "Clarity of the problem",
      "Reliability of status updates",
      "Quality of the demo",
    ],
    isSample: true,
    isPublished: true,
    updatedAt: stamp,
  },
  {
    id: "PS-SAMPLE-02",
    title: "Sample: Equipment checkout desk",
    summary: "Demonstration brief for tracking shared equipment. This is not an official SYNAPSE 24 problem.",
    description:
      "Design a checkout desk for shared lab equipment. The sample is intentionally generic and should be replaced by organizer-provided statements.",
    realWorldProblem:
      "Shared equipment goes missing when checkout records live in a paper notebook.",
    functionalRequirements: [
      "Record a checkout and a return.",
      "Prevent two active checkouts for one item.",
      "Show items that are overdue.",
    ],
    technicalRequirements: [
      "Persist records in a database.",
      "Reject invalid item IDs.",
      "Expose a clear audit timestamp.",
    ],
    expectedDeliverables: ["Working prototype", "Data model", "Test notes"],
    evaluationCriteria: ["Data integrity", "Edge-case handling", "Usability"],
    isSample: true,
    isPublished: true,
    updatedAt: stamp,
  },
  {
    id: "PS-SAMPLE-03",
    title: "Sample: Community knowledge desk",
    summary: "Demonstration brief for a searchable help desk. This is not an official SYNAPSE 24 problem.",
    description:
      "Create a small knowledge desk where published answers can be searched. Do not treat this text as an official challenge.",
    realWorldProblem:
      "New volunteers ask the same setup questions because answers are buried in old messages.",
    functionalRequirements: [
      "Publish an answer with a title and body.",
      "Search published answers.",
      "Hide unpublished drafts.",
    ],
    technicalRequirements: [
      "Separate draft and published states.",
      "Restrict publishing to authorized users.",
      "Return an empty state when nothing matches.",
    ],
    expectedDeliverables: ["Working prototype", "Access-control note"],
    evaluationCriteria: ["Search quality", "Access control", "Clarity"],
    isSample: true,
    isPublished: true,
    updatedAt: stamp,
  },
  {
    id: "PS-SAMPLE-04",
    title: "Sample: Submission window tracker",
    summary: "Demonstration brief for tracking hand-in status. This is not an official SYNAPSE 24 problem.",
    description:
      "Build a tracker that shows whether a team has handed in work. A missing record must not be displayed as a successful submission.",
    realWorldProblem:
      "Coordinators cannot tell which groups have handed work in without opening every message.",
    functionalRequirements: [
      "Record a hand-in URL.",
      "Show teams with no hand-in record.",
      "Reject malformed URLs.",
    ],
    technicalRequirements: [
      "Store one hand-in record per team.",
      "Keep the hand-in time.",
      "Validate http and https URLs.",
    ],
    expectedDeliverables: ["Working prototype", "Validation notes"],
    evaluationCriteria: ["Correct status handling", "Validation", "Presentation"],
    isSample: true,
    isPublished: true,
    updatedAt: stamp,
  },
];

export const demoTeams: Team[] = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  const progress = (
    [
      "not_started",
      "not_started",
      "not_started",
      "not_started",
      "in_progress",
      "in_progress",
      "in_progress",
      "in_progress",
      "submitted",
      "under_review",
      "evaluated",
      "in_progress",
    ] as const
  )[index];
  return {
    id: `T-SAMPLE-${number}`,
    name: `Sample Team ${number}`,
    memberCount: 3 + (index % 3),
    progressStatus: progress,
    isSample: true,
    isPublic: true,
    updatedAt: stamp,
  };
});

export const demoAssignments: Assignment[] = demoTeams.map((team, index) => ({
  teamId: team.id,
  problemId: demoProblems[index % demoProblems.length].id,
  updatedAt: stamp,
}));

export const demoSubmissions: Submission[] = [
  {
    teamId: "T-SAMPLE-09",
    status: "submitted",
    submissionUrl: "https://example.com/sample-submission-09",
    submittedAt: "2026-10-14T11:00:00+05:30",
    updatedAt: stamp,
  },
  {
    teamId: "T-SAMPLE-10",
    status: "under_review",
    submissionUrl: "https://example.com/sample-submission-10",
    submittedAt: "2026-10-14T10:30:00+05:30",
    updatedAt: stamp,
  },
  {
    teamId: "T-SAMPLE-11",
    status: "evaluated",
    submissionUrl: "https://example.com/sample-submission-11",
    submittedAt: "2026-10-14T10:00:00+05:30",
    updatedAt: stamp,
  },
];

export const demoAnnouncements: Announcement[] = [
  {
    id: "sample-announcement-1",
    title: "Sample: demonstration data is on",
    message:
      "These announcements are sample content so the site can be reviewed. They are not official event notices. Connect Supabase and publish real announcements to replace them.",
    category: "important",
    priority: 3,
    isPublished: true,
    publishedAt: "2026-10-14T09:00:00+05:30",
    updatedAt: stamp,
  },
  {
    id: "sample-announcement-2",
    title: "Sample: schedule is illustrative",
    message:
      "The demonstration clock uses the official window of 15–16 October 2026, 09:00 Asia/Kolkata. Team names and problem statements in this mode are still samples.",
    category: "schedule_update",
    priority: 2,
    isPublished: true,
    publishedAt: "2026-10-14T09:30:00+05:30",
    updatedAt: stamp,
  },
  {
    id: "sample-announcement-3",
    title: "Sample: submissions are not real",
    message:
      "A few sample teams have submission records so the dashboard can show submitted and pending counts. Those records are not real projects.",
    category: "submission_reminder",
    priority: 1,
    isPublished: true,
    publishedAt: "2026-10-14T10:00:00+05:30",
    updatedAt: stamp,
  },
];

export const demoSchedule: ScheduleItem[] = [
  {
    id: "sample-schedule-1",
    title: "Sample check-in",
    description: "Illustrative milestone only. Replace this with the official run of show.",
    startsAt: "2026-10-15T08:00:00+05:30",
    endsAt: "2026-10-15T09:00:00+05:30",
    sortOrder: 1,
    isSample: true,
  },
  {
    id: "sample-schedule-2",
    title: "Sample opening",
    description: "Illustrative milestone only.",
    startsAt: "2026-10-15T09:00:00+05:30",
    endsAt: "2026-10-15T09:30:00+05:30",
    sortOrder: 2,
    isSample: true,
  },
  {
    id: "sample-schedule-3",
    title: "Sample building window",
    description: "Illustrative hacking window aligned to the sample event clock.",
    startsAt: "2026-10-15T09:30:00+05:30",
    endsAt: "2026-10-16T08:00:00+05:30",
    sortOrder: 3,
    isSample: true,
  },
  {
    id: "sample-schedule-4",
    title: "Sample submission deadline",
    description: "Illustrative deadline. Official deadlines must be configured by organizers.",
    startsAt: "2026-10-16T08:00:00+05:30",
    endsAt: null,
    sortOrder: 4,
    isSample: true,
  },
  {
    id: "sample-schedule-5",
    title: "Sample closing",
    description: "Illustrative closing milestone.",
    startsAt: "2026-10-16T09:00:00+05:30",
    endsAt: null,
    sortOrder: 5,
    isSample: true,
  },
];
