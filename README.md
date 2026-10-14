# SYNAPSE 24

Command center for the SYNAPSE 24 hackathon, organized by the Coding Club and AI Frontier Club. Participants can follow the event clock, find a team, read problem statements, and check announcements. Administrators can manage those records when Supabase is configured.

## What works without Supabase

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, public pages render clearly labeled demonstration data. Administrator sign-in, publishing, imports, and submission updates stay unavailable. The evaluation module is disabled in both modes.

## Requirements

- Node.js 20.9 or newer
- A Supabase project for persistent data and administrator login
- Vercel for deployment

## Setup

```bash
cd synapse-24
npm install
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

Do not put the service-role key in this app. It is not used, and it must not be exposed to the browser.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In Project Settings → API, copy the Project URL and the `anon` `public` key.
3. Put them in `synapse-24/.env.local`. These are the only environment variables the app reads:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

4. Do not add the service-role key. The app does not use it, and that key must never be placed in client code or `NEXT_PUBLIC_` variables.
5. Restart `npm run dev` after saving `.env.local`. On Vercel, set the same two variables and redeploy.

## Run the database migrations

In the Supabase SQL Editor, run these files in order. Run the whole file each time.

1. `supabase/migrations/20261014000000_init.sql`
2. `supabase/migrations/20261015000000_official_window.sql`

The second migration sets the event clock to 15 October 2026, 09:00 through 16 October 2026, 09:00, Asia/Kolkata, when the clock is empty or still on the old 18–19 October sample. If a different start instant is already stored, that start is kept and the end is set exactly 24 hours later. Sample schedule rows that still fall on 18–19 October move back three days. Other schedule rows are left alone.

Do not run `supabase/seed.sample.sql` for the real event. That file inserts labeled sample teams, a sample brief, and a sample announcement, and it does not overwrite existing IDs.

## Create an administrator

1. In Supabase, open Authentication → Users → Add user. Set an email and password. Turn on “Auto Confirm User” if you do not want to wait for an email.
2. The signup trigger inserts `public.profiles` with `role = 'viewer'`. Promote only the organizer account:

```sql
update public.profiles
set role = 'admin'
where email = 'organizer@example.com';
```

3. Open `/admin/login` and sign in with that email and password. A viewer account is signed out and cannot open the admin tools.
4. There is no in-app control to change roles. Promotion stays in SQL so a signed-in user cannot grant themselves admin.

## Import actual team assignments

1. In Admin → Problem statements, create each official brief and publish it. Use the organizer’s IDs. The importer rejects a problem ID that does not already exist.
2. Download `/templates/teams-import-template.csv`. The header row must be exactly:

```text
team_id,team_name,member_count,problem_id
```

3. Fill one row per team from the verified spreadsheet. Leave `problem_id` blank only when that team should not receive an assignment.
4. Open Admin → CSV import, choose the file, and submit. The import reports row errors and writes nothing if any row fails. Existing assignments are not replaced unless you check “Replace an existing assignment.”
5. Do not put participant names in the file. The public site shows team ID, team name, member count, assignment, and status.

## Authorization

Anonymous visitors can read public teams, published problem statements, published announcements, the schedule, and the event clock. They cannot read submission URLs. Every admin server action loads the signed-in user with `getUser()` and continues only when `profiles.role` is `admin`. The same `is_admin()` check is required by Row Level Security policies and by `import_team_rows`. Hiding a button is not the control. There is no live database in this workspace, so these policies were reviewed in SQL and in the server actions; they were not executed against a Supabase project.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm start
```

## Live Wall

Open [http://localhost:3000/live-wall](http://localhost:3000/live-wall) after `npm run dev`. The route is a 1920×1080 presentation screen: event overview, scrolling teams, every published problem statement in pages of four, and announcements. Use Fullscreen on the auditorium display. Scroll speed, pause, and scene rotation stay in the page while team data refreshes in the background. There is no audio.

## Event clock

The official window is `2026-10-15T09:00:00+05:30` to `2026-10-16T09:00:00+05:30`. The 09:00 start is the time already configured on the sample clock; only the calendar dates moved from 18–19 October. The end is exactly 24 hours later. The countdown uses the server time captured for that request, then keeps an offset so a browser clock does not redefine the official phase. Refreshing does not restart a 24-hour timer.

Admin → Event clock rejects any time zone other than Asia/Kolkata and any end time that is not exactly 24 hours after the start.

## CSV import

Use `public/templates/teams-import-template.csv`.

Required headers:

```text
team_id,team_name,member_count,problem_id
```

The importer reports duplicate team IDs, invalid IDs, and unknown problem statement IDs, and it does not apply a file that has row errors. Existing assignments are left in place unless “replace” is checked.

## Deployment

1. Push the `synapse-24` project to a Git host.
2. Import it in Vercel. Set the root directory to `synapse-24` if the repository also contains other projects.
3. Add the two environment variables in the Vercel project settings.
4. Deploy. Run the SQL migration before inviting administrators.

## Not included

- Judge scoring, leaderboard, and team QR codes are not enabled.
- No official problem statements, team lists, sponsors, mentors, or contact address are invented. Sample records are labeled as demonstration data.
- Contact details appear in the footer only after organizers supply a verified address.
