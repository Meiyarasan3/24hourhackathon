-- SYNAPSE 24 schema
-- Apply this file in the Supabase SQL editor or via the Supabase CLI.
-- It does not insert teams, problem statements, or announcements.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('admin', 'judge', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;

create table if not exists public.event_settings (
  id integer primary key default 1 check (id = 1),
  timezone text not null default 'Asia/Kolkata',
  start_at timestamptz,
  end_at timestamptz,
  status_override text check (status_override in ('scheduled', 'live', 'paused', 'ended')),
  evaluation_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_window_order check (start_at is null or end_at is null or end_at > start_at)
);

create table if not exists public.problem_statements (
  id text primary key check (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$'),
  title text not null check (char_length(title) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 400),
  description text not null,
  real_world_problem text not null,
  functional_requirements text[] not null default '{}',
  technical_requirements text[] not null default '{}',
  expected_deliverables text[] not null default '{}',
  evaluation_criteria text[] not null default '{}',
  is_sample boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key check (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$'),
  name text not null check (char_length(name) between 1 and 80),
  member_count integer not null check (member_count between 0 and 20),
  progress_status text not null default 'not_started' check (
    progress_status in ('not_started', 'in_progress', 'submitted', 'under_review', 'evaluated')
  ),
  is_sample boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One assignment row per team. Replacing it is an explicit update, not a second row.
create table if not exists public.team_assignments (
  team_id text primary key references public.teams (id) on delete cascade,
  problem_id text not null references public.problem_statements (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  team_id text primary key references public.teams (id) on delete cascade,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'submitted', 'under_review', 'evaluated')
  ),
  submission_url text check (
    submission_url is null
    or submission_url ~ '^https://'
    or submission_url ~ '^http://'
  ),
  submitted_at timestamptz,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  message text not null check (char_length(message) between 1 and 4000),
  category text not null check (
    category in ('general', 'important', 'schedule_update', 'submission_reminder')
  ),
  priority integer not null default 0 check (priority between 0 and 3),
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  sort_order integer not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_order check (ends_at is null or ends_at >= starts_at)
);

-- Evaluation tables are created for a later phase. The application does not write scores
-- while event_settings.evaluation_enabled is false, and no official criteria are seeded.
create table if not exists public.evaluation_criteria (
  id text primary key,
  label text not null,
  max_marks integer not null check (max_marks > 0 and max_marks <= 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references public.teams (id) on delete cascade,
  judge_id uuid not null references auth.users (id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  feedback text not null default '',
  total numeric(6, 2),
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, judge_id)
);

create index if not exists teams_name_idx on public.teams (name);
create index if not exists team_assignments_problem_idx on public.team_assignments (problem_id);
create index if not exists announcements_published_idx
  on public.announcements (is_published, published_at desc);
create index if not exists schedule_items_order_idx on public.schedule_items (sort_order, starts_at);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists event_settings_updated_at on public.event_settings;
create trigger event_settings_updated_at before update on public.event_settings
for each row execute function public.set_updated_at();

drop trigger if exists problem_statements_updated_at on public.problem_statements;
create trigger problem_statements_updated_at before update on public.problem_statements
for each row execute function public.set_updated_at();

drop trigger if exists teams_updated_at on public.teams;
create trigger teams_updated_at before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists team_assignments_updated_at on public.team_assignments;
create trigger team_assignments_updated_at before update on public.team_assignments
for each row execute function public.set_updated_at();

drop trigger if exists submissions_updated_at on public.submissions;
create trigger submissions_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists announcements_updated_at on public.announcements;
create trigger announcements_updated_at before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists schedule_items_updated_at on public.schedule_items;
create trigger schedule_items_updated_at before update on public.schedule_items
for each row execute function public.set_updated_at();

drop trigger if exists evaluations_updated_at on public.evaluations;
create trigger evaluations_updated_at before update on public.evaluations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.event_settings (id, timezone)
values (1, 'Asia/Kolkata')
on conflict (id) do nothing;

create or replace function public.import_team_rows(
  payload jsonb,
  update_existing boolean default false,
  replace_assignments boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  row_number integer;
  team_id text;
  team_name text;
  member_count integer;
  problem_id text;
  existing_team public.teams%rowtype;
  existing_assignment public.team_assignments%rowtype;
  seen text[] := array[]::text[];
  errors jsonb := '[]'::jsonb;
  teams_created integer := 0;
  teams_updated integer := 0;
  teams_unchanged integer := 0;
  assignments_created integer := 0;
  assignments_replaced integer := 0;
  assignments_unchanged integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if jsonb_typeof(payload) <> 'array' then
    return jsonb_build_object('applied', false, 'errors', jsonb_build_array(jsonb_build_object('row', 1, 'message', 'Import payload must be a list.')));
  end if;

  for item in select value from jsonb_array_elements(payload)
  loop
    row_number := coalesce((item->>'row')::integer, 0);
    team_id := btrim(coalesce(item->>'teamId', ''));
    team_name := btrim(coalesce(item->>'teamName', ''));
    problem_id := nullif(btrim(coalesce(item->>'problemId', '')), '');

    begin
      member_count := (item->>'memberCount')::integer;
    exception when others then
      member_count := null;
    end;

    if team_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$' then
      errors := errors || jsonb_build_array(jsonb_build_object('row', row_number, 'message', 'Invalid team ID.'));
    elsif lower(team_id) = any (seen) then
      errors := errors || jsonb_build_array(jsonb_build_object('row', row_number, 'message', 'Duplicate team ID in this file.'));
    elsif team_name = '' or char_length(team_name) > 80 then
      errors := errors || jsonb_build_array(jsonb_build_object('row', row_number, 'message', 'Invalid team name.'));
    elsif member_count is null or member_count < 0 or member_count > 20 then
      errors := errors || jsonb_build_array(jsonb_build_object('row', row_number, 'message', 'Invalid member count.'));
    elsif problem_id is not null and not exists (select 1 from public.problem_statements where id = problem_id) then
      errors := errors || jsonb_build_array(jsonb_build_object('row', row_number, 'message', 'Unknown problem statement ID.'));
    elsif problem_id is not null
      and not replace_assignments
      and exists (
        select 1
        from public.team_assignments as existing
        where existing.team_id = import_team_rows.team_id
          and existing.problem_id is distinct from import_team_rows.problem_id
      )
    then
      errors := errors || jsonb_build_array(jsonb_build_object('row', row_number, 'message', 'This team already has a different assignment. Enable replacement to change it.'));
    end if;

    seen := seen || lower(team_id);
  end loop;

  if jsonb_array_length(errors) > 0 then
    return jsonb_build_object('applied', false, 'errors', errors);
  end if;

  for item in select value from jsonb_array_elements(payload)
  loop
    team_id := btrim(item->>'teamId');
    team_name := btrim(item->>'teamName');
    member_count := (item->>'memberCount')::integer;
    problem_id := nullif(btrim(coalesce(item->>'problemId', '')), '');

    select * into existing_team from public.teams where id = team_id;
    if not found then
      insert into public.teams (id, name, member_count, is_sample, is_public)
      values (team_id, team_name, member_count, false, true);
      teams_created := teams_created + 1;
    elsif update_existing and (existing_team.name is distinct from team_name or existing_team.member_count is distinct from member_count) then
      update public.teams
      set name = team_name, member_count = member_count
      where id = team_id;
      teams_updated := teams_updated + 1;
    else
      teams_unchanged := teams_unchanged + 1;
    end if;

    if problem_id is null then
      continue;
    end if;

    select * into existing_assignment from public.team_assignments where team_id = team_id;
    if not found then
      insert into public.team_assignments (team_id, problem_id)
      values (team_id, problem_id);
      assignments_created := assignments_created + 1;
    elsif existing_assignment.problem_id = problem_id then
      assignments_unchanged := assignments_unchanged + 1;
    elsif replace_assignments then
      update public.team_assignments
      set problem_id = import_team_rows.problem_id
      where team_id = import_team_rows.team_id;
      assignments_replaced := assignments_replaced + 1;
    else
      raise exception 'Team % already has a different assignment. Re-run with replacement enabled.', team_id;
    end if;
  end loop;

  return jsonb_build_object(
    'applied', true,
    'errors', '[]'::jsonb,
    'summary', jsonb_build_object(
      'teamsCreated', teams_created,
      'teamsUpdated', teams_updated,
      'teamsUnchanged', teams_unchanged,
      'assignmentsCreated', assignments_created,
      'assignmentsReplaced', assignments_replaced,
      'assignmentsUnchanged', assignments_unchanged
    )
  );
end;
$$;

revoke all on function public.import_team_rows(jsonb, boolean, boolean) from public;
grant execute on function public.import_team_rows(jsonb, boolean, boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.event_settings enable row level security;
alter table public.problem_statements enable row level security;
alter table public.teams enable row level security;
alter table public.team_assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.announcements enable row level security;
alter table public.schedule_items enable row level security;
alter table public.evaluation_criteria enable row level security;
alter table public.evaluations enable row level security;

alter table public.profiles force row level security;
alter table public.event_settings force row level security;
alter table public.problem_statements force row level security;
alter table public.teams force row level security;
alter table public.team_assignments force row level security;
alter table public.submissions force row level security;
alter table public.announcements force row level security;
alter table public.schedule_items force row level security;
alter table public.evaluation_criteria force row level security;
alter table public.evaluations force row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "public read settings" on public.event_settings;
create policy "public read settings" on public.event_settings
for select to anon, authenticated
using (true);

drop policy if exists "admin write settings" on public.event_settings;
create policy "admin write settings" on public.event_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read problems" on public.problem_statements;
create policy "public read problems" on public.problem_statements
for select to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "admin write problems" on public.problem_statements;
create policy "admin write problems" on public.problem_statements
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read teams" on public.teams;
create policy "public read teams" on public.teams
for select to anon, authenticated
using (is_public = true or public.is_admin());

drop policy if exists "admin write teams" on public.teams;
create policy "admin write teams" on public.teams
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read assignments" on public.team_assignments;
create policy "public read assignments" on public.team_assignments
for select to anon, authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.teams
    where teams.id = team_assignments.team_id
      and teams.is_public = true
  )
);

drop policy if exists "admin write assignments" on public.team_assignments;
create policy "admin write assignments" on public.team_assignments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read submissions" on public.submissions;
create policy "public read submissions" on public.submissions
for select to anon, authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.teams
    where teams.id = submissions.team_id
      and teams.is_public = true
  )
);

drop policy if exists "admin write submissions" on public.submissions;
create policy "admin write submissions" on public.submissions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read announcements" on public.announcements;
create policy "public read announcements" on public.announcements
for select to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "admin write announcements" on public.announcements;
create policy "admin write announcements" on public.announcements
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read schedule" on public.schedule_items;
create policy "public read schedule" on public.schedule_items
for select to anon, authenticated
using (true);

drop policy if exists "admin write schedule" on public.schedule_items;
create policy "admin write schedule" on public.schedule_items
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin read criteria" on public.evaluation_criteria;
create policy "admin read criteria" on public.evaluation_criteria
for select to authenticated
using (public.is_admin() or exists (
  select 1 from public.profiles where id = auth.uid() and role = 'judge'
));

drop policy if exists "admin read evaluations" on public.evaluations;
create policy "admin read evaluations" on public.evaluations
for select to authenticated
using (public.is_admin() or judge_id = auth.uid());

-- No insert/update policy is granted for evaluations in this migration.
-- Judge scoring stays disabled until organizers explicitly add that phase.

revoke select on public.submissions from anon;
grant select (team_id, status, submitted_at, updated_at, created_at) on public.submissions to anon;

do $$
begin
  alter publication supabase_realtime add table public.announcements;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
