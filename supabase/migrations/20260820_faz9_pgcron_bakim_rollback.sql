do $$ begin perform cron.unschedule('bakim_log_temizle'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('bakim_stale_davet'); exception when others then null; end $$;
