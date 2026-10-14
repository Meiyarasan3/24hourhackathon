import assert from "node:assert/strict";
import { deriveEventClock } from "../src/lib/countdown";
import { buildWallScenes, wallHalf } from "../src/lib/live-wall";
import { matchesTeam } from "../src/lib/team-query";
import { validateImportCsv } from "../src/lib/validation";
import type { TeamRecord } from "../src/lib/types";

const start = "2026-10-15T09:00:00+05:30";
const end = "2026-10-16T09:00:00+05:30";
const startMs = Date.parse(start);
const endMs = Date.parse(end);

const before = deriveEventClock(startMs - 90_000, start, end);
assert.equal(before.phase, "before");
assert.equal(before.remainingMs, 90_000);

const live = deriveEventClock(startMs + 60_000, start, end);
assert.equal(live.phase, "live");
assert.equal(live.remainingMs, endMs - (startMs + 60_000));

const ended = deriveEventClock(endMs + 1, start, end);
assert.equal(ended.phase, "ended");
assert.equal(ended.headline, "The 24-hour event has ended");

const again = deriveEventClock(startMs + 60_000, start, end);
assert.equal(again.remainingMs, live.remainingMs);

assert.equal(deriveEventClock(startMs, null, end).phase, "unconfigured");
assert.equal(deriveEventClock(startMs, end, start).phase, "invalid");
assert.equal(deriveEventClock(startMs, "2026-10-15T09:00:00", end).phase, "invalid");
assert.equal(endMs - startMs, 24 * 60 * 60 * 1000);

const sample = {
  id: "T-SAMPLE-09",
  name: "Sample Team 09",
  memberCount: 4,
  progressStatus: "submitted",
  isSample: true,
  isPublic: true,
  updatedAt: "2026-10-14T12:00:00+05:30",
  assignment: { teamId: "T-SAMPLE-09", problemId: "PS-SAMPLE-01", updatedAt: "2026-10-14T12:00:00+05:30" },
  problem: null,
  submission: {
    teamId: "T-SAMPLE-09",
    status: "submitted",
    submissionUrl: null,
    submittedAt: "2026-10-14T11:00:00+05:30",
    updatedAt: "2026-10-14T12:00:00+05:30",
  },
  lastUpdated: "2026-10-14T12:00:00+05:30",
} satisfies TeamRecord;

assert.equal(matchesTeam(sample, { query: "t-sample-09", problem: "", progress: "", submission: "" }), true);
assert.equal(matchesTeam(sample, { query: "missing", problem: "", progress: "", submission: "" }), false);
assert.equal(matchesTeam(sample, { query: "", problem: "PS-SAMPLE-02", progress: "", submission: "" }), false);
assert.equal(matchesTeam(sample, { query: "", problem: "", progress: "submitted", submission: "handed_in" }), true);
assert.equal(matchesTeam(sample, { query: "", problem: "", progress: "", submission: "pending" }), false);

const csv = validateImportCsv(
  "team_id,team_name,member_count,problem_id\nT-1,Alpha,4,PS-SAMPLE-01\nT-1,Beta,4,PS-SAMPLE-01\nBAD ID,Gamma,4,PS-NOPE\n",
  new Set(["PS-SAMPLE-01"]),
);
assert.equal(csv.rows.length, 1);
assert.ok(csv.errors.some((error) => error.message.includes("Duplicate")));
assert.ok(csv.errors.some((error) => error.message.includes("Team ID")));

const clean = validateImportCsv(
  "team_id,team_name,member_count,problem_id\nT-1,Alpha,4,PS-SAMPLE-01\n",
  new Set(["PS-SAMPLE-01"]),
);
assert.equal(clean.errors.length, 0);
assert.equal(clean.rows[0]?.teamId, "T-1");

assert.equal(wallHalf([1, 2, 3, 4, 5], 100, 50).length, 5);
assert.equal(wallHalf(Array.from({ length: 50 }, (_, index) => index)).length, 50);
assert.equal(wallHalf([]).length, 0);
assert.equal(buildWallScenes(0).filter((scene) => scene.kind === "problems").length, 1);
assert.equal(buildWallScenes(4).filter((scene) => scene.kind === "problems").length, 1);
assert.equal(buildWallScenes(5).filter((scene) => scene.kind === "problems").length, 2);
assert.equal(buildWallScenes(9).filter((scene) => scene.kind === "problems").length, 3);

console.log("countdown, filter, import, and live-wall checks passed");
