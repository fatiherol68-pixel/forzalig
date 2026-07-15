-- =====================================================================
--  ForzaLig — Faz 4: OPERASYON MERKEZİ METRİKLERİ (gerçek veriler)
--  Kendi DB'mizden GERÇEK sayılar: sayımlar, MAU, depolama (storage.objects
--  boyutundan), arşiv, çöp kutusu, orphan (sahipsiz dosya). Sadece admin.
--  Bir kez çalıştır. İdempotent.
-- =====================================================================

-- MAU için: kullanıcı uygulamayı her açtığında son_gorulme güncellenir.
alter table public.profiller add column if not exists son_gorulme timestamptz;
create index if not exists ix_profil_songor on public.profiller(son_gorulme);

create or replace function public.ben_buradayim()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiller set son_gorulme = now() where user_id = auth.uid();
end $$;
grant execute on function public.ben_buradayim() to authenticated;

-- Tek çağrıda tüm GERÇEK metrikler (jsonb). Sadece süper admin.
create or replace function public.panel_metrikler()
returns jsonb language plpgsql security definer set search_path = public, storage as $$
declare j jsonb;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  select jsonb_build_object(
    'lig',         (select count(*) from public.ligler where silindi = false),
    'lig_cop',     (select count(*) from public.ligler where silindi = true),
    'takim',       (select count(*) from public.takimlar),
    'oyuncu',      (select count(*) from public.oyuncular),
    'mac',         (select count(*) from public.maclar),
    'uye',         (select count(*) from public.profiller),
    'mau',         (select count(*) from public.profiller where son_gorulme > now() - interval '30 days'),
    'mesaj',       (select count(*) from public.sohbet_mesajlari where arsiv = false),
    'mesaj_arsiv', (select count(*) from public.sohbet_mesajlari where arsiv = true),
    'foto',        (select count(*) from public.oyuncular where foto is not null),
    'logo',        (select count(*) from public.takimlar  where logo is not null),
    'depo_bayt',   coalesce((select sum((metadata->>'size')::bigint) from storage.objects where bucket_id='fotolar'),0),
    'depo_dosya',  (select count(*) from storage.objects where bucket_id='fotolar')
  ) into j;
  return j;
end $$;
grant execute on function public.panel_metrikler() to authenticated;

-- Sahipsiz (orphan) dosyalar: DB'de hiçbir oyuncu/takım referans etmiyor.
create or replace function public.depo_orphan_bul()
returns table(yol text, boyut bigint)
language plpgsql security definer set search_path = public, storage as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
  select o.name, coalesce((o.metadata->>'size')::bigint, 0)
  from storage.objects o
  where o.bucket_id = 'fotolar'
    and not exists (select 1 from public.oyuncular p where p.foto like '%/fotolar/' || o.name)
    and not exists (select 1 from public.takimlar  t where t.logo like '%/fotolar/' || o.name);
end $$;
grant execute on function public.depo_orphan_bul() to authenticated;
-- (Silme işlemi panelden storage API ile yapılır — admin_mi() silme izni SQL 36'da var.)
