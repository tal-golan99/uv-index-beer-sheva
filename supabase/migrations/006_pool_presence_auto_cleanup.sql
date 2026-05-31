-- Auto-remove stale pool presence: anyone checked in more than 4 hours ago is
-- dropped from pool_presence so "who's in the pool now" stays accurate even if a
-- user never presses "יצאתי" (e.g. they just left without checking out).
--
-- Runs server-side via pg_cron every 5 minutes, independent of page traffic.
-- pool_presence is in the supabase_realtime publication, so these deletes
-- propagate to all open clients automatically. A 5-minute cadence keeps cron
-- work and realtime delete events negligible (well within the free tier).
create extension if not exists pg_cron;

-- Idempotent: drop a prior schedule of the same name before (re)creating it.
select cron.unschedule('cleanup-pool-presence')
where exists (select 1 from cron.job where jobname = 'cleanup-pool-presence');

select cron.schedule(
  'cleanup-pool-presence',
  '*/5 * * * *',
  $$delete from pool_presence where checked_in_at < now() - interval '4 hours'$$
);
