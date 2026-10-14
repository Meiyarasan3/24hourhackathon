"use client";

import { useEffect, useMemo, useState } from "react";
import { deriveEventClock, splitDuration } from "@/lib/countdown";
import { categoryLabel, overrideLabel, progressLabel } from "@/lib/labels";
import { PROBLEMS_PER_SCENE, WALL_ROW_PX, buildWallScenes, wallHalf, type WallScene } from "@/lib/live-wall";
import { assignmentCounts, computeStats } from "@/lib/stats";
import type { PublicData, TeamRecord } from "@/lib/types";
import "./wall.css";

const SCENE_BUTTONS = ["overview", "teams", "problems", "announcements"] as const;

const SCENE_LABELS = {
  overview: "Event overview",
  teams: "Team showcase",
  problems: "Problem statements",
  announcements: "Announcements",
} as const;

const ROTATION_MS = 20000;

export function LiveWall({ initial }: { initial: PublicData }) {
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(initial.serverNow);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [scrollPaused, setScrollPaused] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [secondsPerTeam, setSecondsPerTeam] = useState(8);
  const [fullscreen, setFullscreen] = useState(false);
  const [refreshNote, setRefreshNote] = useState("Waiting for the next update");

  useEffect(() => {
    const offset = data.serverNow - Date.now();
    const id = window.setInterval(() => setNow(Date.now() + offset), 1000);
    return () => window.clearInterval(id);
  }, [data.serverNow]);

  useEffect(() => {
    if (rotationPaused) return;
    const id = window.setInterval(() => {
      setSceneIndex((current) => current + 1);
    }, ROTATION_MS);
    return () => window.clearInterval(id);
  }, [rotationPaused]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const response = await fetch("/api/live-wall", { cache: "no-store" });
        const body = (await response.json()) as { ok: boolean; data?: PublicData };
        if (cancelled) return;
        if (!response.ok || !body.ok || !body.data) {
          setRefreshNote("Update failed. Showing the last loaded records.");
          return;
        }
        setData(body.data);
        setRefreshNote("Records updated");
      } catch {
        if (!cancelled) setRefreshNote("Update failed. Showing the last loaded records.");
      }
    };
    const id = window.setInterval(pull, 25000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const stats = computeStats(data.teams);
  const clock = deriveEventClock(now, data.settings.startAt, data.settings.endAt);
  const counts = assignmentCounts(data.teams);
  const problems = [...data.problems].sort((a, b) => a.id.localeCompare(b.id));
  const scenes = useMemo(() => buildWallScenes(problems.length), [problems.length]);
  const scene = scenes[((sceneIndex % scenes.length) + scenes.length) % scenes.length];
  const announcements = [...data.announcements].sort((a, b) => b.priority - a.priority || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const half = useMemo(() => wallHalf(data.teams), [data.teams]);
  const duration = Math.max(half.length, 1) * secondsPerTeam;

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setRefreshNote("Fullscreen is unavailable in this browser.");
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#070b14] text-foreground">
      <header className="flex items-center justify-between gap-6 border-b border-border px-8 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">24-hour hackathon</p>
          <p className="mt-1 text-3xl font-semibold tracking-[0.18em]">
            SYNAPSE <span className="font-mono text-accent">24</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{data.settings.timezone}</p>
          <p className="text-lg font-medium">{data.settings.statusOverride ? overrideLabel(data.settings.statusOverride) : clock.headline}</p>
        </div>
      </header>

      {data.source === "demonstration" ? (
        <p className="bg-amber-300/10 px-8 py-2 text-sm text-amber-100">
          Demonstration data. These teams, assignments, and announcements are samples, not official event records.
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {sceneLabel(scene, problems.length)}
      </p>
      <main className="relative min-h-0 flex-1">
        <section className={sceneClass(scene.kind === "overview")}>
          <Overview clock={clock} stats={stats} />
        </section>
        <section className={sceneClass(scene.kind === "teams")} aria-hidden={scene.kind !== "teams"}>
          <TeamShowcase half={half} paused={scrollPaused} duration={duration} />
        </section>
        <section className={sceneClass(scene.kind === "problems")}>
          <ProblemOverview
            problems={scene.kind === "problems" ? problems.slice(scene.page * PROBLEMS_PER_SCENE, (scene.page + 1) * PROBLEMS_PER_SCENE) : []}
            counts={counts}
            page={scene.kind === "problems" ? scene.page : 0}
            total={problems.length}
          />
        </section>
        <section className={sceneClass(scene.kind === "announcements")}>
          <AnnouncementOverview announcements={announcements} />
        </section>
      </main>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-3">
        {SCENE_BUTTONS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={scene.kind === item}
            onClick={() => setSceneIndex(scenes.findIndex((entry) => entry.kind === item))}
            className={`rounded-full px-3 py-1.5 text-sm ${scene.kind === item ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
          >
            {SCENE_LABELS[item]}
          </button>
        ))}
        <button type="button" onClick={() => setScrollPaused((value) => !value)} className="rounded-full border border-border px-3 py-1.5 text-sm">
          {scrollPaused ? "Resume scroll" : "Pause scroll"}
        </button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Speed
          <input
            type="range"
            min={4}
            max={16}
            step={1}
            value={secondsPerTeam}
            aria-valuetext={`${secondsPerTeam} seconds per team`}
            onChange={(event) => setSecondsPerTeam(Number(event.target.value))}
          />
          <span className="w-28 font-mono text-xs">{secondsPerTeam}s per team</span>
        </label>
        <button type="button" onClick={() => setRotationPaused((value) => !value)} className="rounded-full border border-border px-3 py-1.5 text-sm">
          {rotationPaused ? "Resume rotation" : "Pause rotation"}
        </button>
        <button type="button" onClick={() => void toggleFullscreen()} className="rounded-full border border-border px-3 py-1.5 text-sm">
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
        <p className="ml-auto text-xs text-muted-foreground">{refreshNote}</p>
      </footer>
    </div>
  );
}

function sceneLabel(scene: WallScene, totalProblems: number) {
  if (scene.kind !== "problems") return SCENE_LABELS[scene.kind];
  const pages = Math.max(1, Math.ceil(totalProblems / PROBLEMS_PER_SCENE));
  return pages > 1 ? `Problem statements, page ${scene.page + 1} of ${pages}` : "Problem statements";
}

function sceneClass(active: boolean) {
  return active ? "h-full overflow-hidden" : "invisible absolute inset-0 -z-10 overflow-hidden";
}

function Overview({
  clock,
  stats,
}: {
  clock: ReturnType<typeof deriveEventClock>;
  stats: ReturnType<typeof computeStats>;
}) {
  const parts = clock.remainingMs === null ? null : splitDuration(clock.remainingMs);
  return (
    <div className="flex h-full flex-col justify-center px-10">
      <h1 className="max-w-5xl text-5xl font-semibold tracking-tight xl:text-7xl">24 Hours. One Mission: Build What&apos;s Next.</h1>
      <p className="mt-4 text-2xl text-muted-foreground">{clock.headline}</p>
      {parts ? (
        <div className="mt-8 grid max-w-4xl grid-cols-4 gap-4">
          <ClockUnit value={parts.days} label="Days" />
          <ClockUnit value={parts.hours} label="Hours" />
          <ClockUnit value={parts.minutes} label="Minutes" />
          <ClockUnit value={parts.seconds} label="Seconds" />
        </div>
      ) : (
        <p className="mt-6 max-w-3xl text-xl text-muted-foreground">{clock.detail}</p>
      )}
      <div className="mt-10 grid max-w-5xl grid-cols-3 gap-4">
        <Stat label="Total teams" value={stats.totalTeams} />
        <Stat label="Active teams" value={stats.activeTeams} />
        <Stat label="Submitted projects" value={stats.submittedProjects} />
      </div>
    </div>
  );
}

function ClockUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-5 text-center">
      <div className="font-mono text-6xl tabular-nums">{String(value).padStart(2, "0")}</div>
      <div className="mt-2 text-sm uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-card px-6 py-5">
      <p className="text-sm uppercase tracking-wide text-accent">{label}</p>
      <p className="mt-2 font-mono text-6xl tabular-nums">{value}</p>
    </div>
  );
}

function TeamShowcase({ half, paused, duration }: { half: TeamRecord[]; paused: boolean; duration: number }) {
  if (half.length === 0) {
    return <p className="grid h-full place-items-center text-2xl text-muted-foreground">No public teams are available.</p>;
  }
  const loop = [...half, ...half];
  return (
    <div className="h-full overflow-hidden">
      <div
        className={paused ? "synapse-wall-track is-paused" : "synapse-wall-track"}
        style={{ ["--wall-duration" as string]: `${duration}s` }}
      >
        {loop.map((team, index) => (
          <TeamRow key={`${team.id}-${index}`} team={team} />
        ))}
      </div>
    </div>
  );
}

function TeamRow({ team }: { team: TeamRecord }) {
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1.1fr)_minmax(0,1.4fr)_11rem_13rem] items-center gap-6 border-b border-border px-10" style={{ height: WALL_ROW_PX }}>
      <p className="font-mono text-2xl text-accent">{team.id}</p>
      <p className="truncate text-3xl font-semibold">{team.name}</p>
      <p className="truncate text-xl text-muted-foreground">{team.problem ? team.problem.title : "No problem assigned"}</p>
      <p className="text-lg">{progressLabel(team.progressStatus)}</p>
      <p className="text-lg">{team.submission ? progressLabel(team.submission.status) : "No submission record"}</p>
    </div>
  );
}

function ProblemOverview({
  problems,
  counts,
  page,
  total,
}: {
  problems: PublicData["problems"];
  counts: Map<string, number>;
  page: number;
  total: number;
}) {
  if (total === 0) {
    return <p className="grid h-full place-items-center text-2xl text-muted-foreground">No published problem statements.</p>;
  }
  const from = page * PROBLEMS_PER_SCENE + 1;
  const to = page * PROBLEMS_PER_SCENE + problems.length;
  return (
    <div className="flex h-full flex-col overflow-hidden p-8">
      <p className="mb-3 text-sm text-muted-foreground">
        Statements {from}–{to} of {total}
      </p>
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-4">
      {problems.map((problem) => (
        <article key={problem.id} className="rounded-2xl border border-border bg-card p-6">
          <p className="font-mono text-accent">{problem.id}</p>
          <h2 className="mt-2 text-3xl font-semibold">{problem.title}</h2>
          <p className="mt-3 line-clamp-3 text-lg text-muted-foreground">{problem.summary}</p>
          <p className="mt-4 text-xl">{counts.get(problem.id) ?? 0} assigned teams</p>
        </article>
      ))}
      </div>
    </div>
  );
}

function AnnouncementOverview({ announcements }: { announcements: PublicData["announcements"] }) {
  if (announcements.length === 0) {
    return <p className="grid h-full place-items-center text-2xl text-muted-foreground">No published announcements.</p>;
  }
  return (
    <div className="flex h-full flex-col justify-center gap-4 px-10">
      {announcements.slice(0, 3).map((item) => (
        <article key={item.id} className="rounded-2xl border border-border bg-card px-8 py-6">
          <p className="text-sm uppercase tracking-wide text-accent">{categoryLabel(item.category)}</p>
          <h2 className="mt-2 text-4xl font-semibold">{item.title}</h2>
          <p className="mt-3 line-clamp-3 text-xl text-muted-foreground">{item.message}</p>
        </article>
      ))}
    </div>
  );
}
