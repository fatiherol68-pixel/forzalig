-- Faz 9 — Admin kota + bakım RPC'leri (admin-only, SECURITY DEFINER)
create or replace function public.admin_kota()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when not public.admin_mi() then '{"hata":"yetkisiz"}'::jsonb else jsonb_build_object(
    'db_bayt', pg_database_size(current_database()),
    'db_mb', round(pg_database_size(current_database())/1048576.0,1),
    'tablo_sayisi', (select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'),
    'lig', (select count(*) from public.ligler where coalesce(silindi,false)=false),
    'oyuncu', (select count(*) from public.oyuncular),
    'mac', (select count(*) from public.maclar),
    'kullanici', (select count(*) from auth.users),
    'sohbet_mesaj', (select count(*) from public.sohbet_mesajlari),
    'olay_log', (select count(*) from public.olay_log),
    'hata_log', (select count(*) from public.hata_log),
    'aktif_davet', (select count(*) from public.davetler where aktif),
    'olcum_t', now()
  ) end;
$$;

-- Log retention: N günden eski olay/hata loglarını sil (admin-only)
create or replace function public.log_temizle(p_gun integer default 90)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare n1 int; n2 int;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  delete from public.olay_log where created < now() - make_interval(days=>p_gun); get diagnostics n1=row_count;
  delete from public.hata_log where olusma < now() - make_interval(days=>p_gun); get diagnostics n2=row_count;
  return jsonb_build_object('olay_silinen',n1,'hata_silinen',n2,'gun',p_gun);
end $$;

-- Stale davet: 30 günden eski davetleri kapat (fonksiyon-içi süreye ek emniyet)
create or replace function public.stale_davet_kapat()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n int;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.davetler set aktif=false where aktif and created < now() - interval '30 days'; get diagnostics n=row_count;
  return n;
end $$;

revoke execute on function public.admin_kota(), public.log_temizle(integer), public.stale_davet_kapat() from public, anon;
grant execute on function public.admin_kota(), public.log_temizle(integer), public.stale_davet_kapat() to authenticated, service_role;
