-- Move the sample 18–19 October window to the official 15–16 October 2026 window.
-- A start time that is already something other than the sample instant is kept.
-- The end time is always exactly 24 hours after the start time.
-- Time zone is Asia/Kolkata.

update public.event_settings
set
  timezone = 'Asia/Kolkata',
  start_at = case
    when start_at is null or start_at = timestamptz '2026-10-18 09:00:00+05:30'
      then timestamptz '2026-10-15 09:00:00+05:30'
    else start_at
  end,
  end_at = case
    when start_at is null or start_at = timestamptz '2026-10-18 09:00:00+05:30'
      then timestamptz '2026-10-16 09:00:00+05:30'
    else start_at + interval '24 hours'
  end
where id = 1;

update public.schedule_items
set
  starts_at = starts_at - interval '3 days',
  ends_at = case when ends_at is null then null else ends_at - interval '3 days' end
where is_sample = true
  and starts_at >= timestamptz '2026-10-18 00:00:00+05:30'
  and starts_at < timestamptz '2026-10-20 00:00:00+05:30';
