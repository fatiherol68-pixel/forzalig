-- Faz 9 — pg_cron bakım otomasyonu (ÜCRETSIZ). Yalnız GÜVENLİ işler:
-- log temizliği + eski davet kapatma. Gerçek lig/oyuncu/maç/kullanıcı/dosya
-- OTOMATİK SİLİNMEZ. Bakım fonksiyonları cron (superuser) tarafından da çağrılabilir.
create or replace function public.log_temizle(p_gun integer default 90)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare n1 int; n2 int;
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role','cron')) then
    raise exception 'yetkisiz'; end if;
  delete from public.olay_log where created < now() - make_interval(days=>p_gun); get diagnostics n1=row_count;
  delete from public.hata_log where olusma  < now() - make_interval(days=>p_gun); get diagnostics n2=row_count;
  return jsonb_build_object('olay_silinen',n1,'hata_silinen',n2,'gun',p_gun);
end $$;
create or replace function public.stale_davet_kapat()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n int;
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role','cron')) then
    raise exception 'yetkisiz'; end if;
  update public.davetler set aktif=false where aktif and created < now() - interval '30 days'; get diagnostics n=row_count;
  return n;
end $$;
create extension if not exists pg_cron;
do $$ begin perform cron.unschedule('bakim_log_temizle'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('bakim_stale_davet'); exception when others then null; end $$;
select cron.schedule('bakim_log_temizle', '0 4 * * 0', $$select public.log_temizle(90)$$);
select cron.schedule('bakim_stale_davet', '30 4 * * 0', $$select public.stale_davet_kapat()$$);
