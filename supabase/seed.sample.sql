-- OPTIONAL demonstration seed. This is not official SYNAPSE 24 data.
-- Existing IDs are left untouched.

insert into public.event_settings (id, timezone, start_at, end_at, status_override)
values (
  1,
  'Asia/Kolkata',
  '2026-10-15T09:00:00+05:30',
  '2026-10-16T09:00:00+05:30',
  null
)
on conflict (id) do nothing;

insert into public.problem_statements (
  id, title, summary, description, real_world_problem,
  functional_requirements, technical_requirements, expected_deliverables, evaluation_criteria,
  is_sample, is_published
) values
(
  'PS-SAMPLE-01',
  'Sample: Campus operations board',
  'Demonstration brief. Not an official problem statement.',
  'Sample description for review of the problem directory.',
  'Sample problem context only.',
  array['Show request status'],
  array['Persist records'],
  array['Prototype'],
  array['Clarity'],
  true,
  true
)
on conflict (id) do nothing;

insert into public.teams (id, name, member_count, progress_status, is_sample, is_public)
values ('T-SAMPLE-01', 'Sample Team 01', 4, 'in_progress', true, true)
on conflict (id) do nothing;

insert into public.team_assignments (team_id, problem_id)
values ('T-SAMPLE-01', 'PS-SAMPLE-01')
on conflict (team_id) do nothing;

insert into public.announcements (id, title, message, category, priority, is_published, published_at)
values (
  '11111111-1111-4111-8111-111111111111',
  'Sample announcement',
  'This is demonstration copy, not an official notice.',
  'general',
  1,
  true,
  '2026-10-14T09:00:00+05:30'
)
on conflict (id) do nothing;

insert into public.schedule_items (id, title, description, starts_at, ends_at, sort_order, is_sample)
values (
  '22222222-2222-4222-8222-222222222222',
  'Sample opening',
  'Illustrative milestone only.',
  '2026-10-15T09:00:00+05:30',
  '2026-10-15T09:30:00+05:30',
  1,
  true
)
on conflict (id) do nothing;
