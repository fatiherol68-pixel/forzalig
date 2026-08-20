-- ForzaLig — FAZ 1: Kritik güvenlik sertleştirmesi
-- Uygulanma: Supabase apply_migration (canlı) — 2026-08-20
-- Etki: production tasarımı DEĞİŞMEZ; yalnız yetki/erişim sertleşir.
-- Geri dönüş: 20260820_faz1_guvenlik_rollback.sql

-- 1) Sabit admin e-postası yerine tablo tabanlı admin_mi() ------------
--    (adminler tablosunda mevcut admin + ikinci admin zaten kayıtlı;
--     davranış korunur, kişisel e-posta policy'den çıkar, admin yönetimi
--     artık 'adminler' tablosundan yapılır.)
alter policy "admin her ligi siler" on public.paylasilan_ligler
  using ( public.admin_mi() );
alter policy "admin yetki gunceller" on public.yetkiler
  using ( public.admin_mi() );
alter policy "admin yetki okur" on public.yetkiler
  using ( public.admin_mi() );
alter policy "admin yetki siler" on public.yetkiler
  using ( public.admin_mi() );
alter policy "admin yetki yazar" on public.yetkiler
  with check ( public.admin_mi() );

-- 2) search_path injection: trigger fonksiyonunu sabitle --------------
alter function public.trg_kart_foto_limit() set search_path = public;

-- 3) Trigger fonksiyonları: doğrudan çağrı yüzeyini kaldır ------------
--    (trigger'lar tablo sahibi olarak çalışır; anon/authenticated'ın bu
--     fonksiyonları RPC ile çağırmasına gerek yoktur.)
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
      and p.prorettype = 'pg_catalog.trigger'::regtype
  loop
    execute format('revoke execute on function %s from anon, authenticated, public', r.sig);
  end loop;
end $$;

-- 4) anon EXECUTE: normal SECURITY DEFINER fonksiyonlarından kaldır ---
--    NOT: Supabase varsayılanı EXECUTE'u PUBLIC'e verir; anon bu yüzden
--    PUBLIC üzerinden erişir. Bu nedenle PUBLIC + anon'dan kaldırıp,
--    uygulamanın çalışması için authenticated + service_role'ü AÇIKÇA veriyoruz.
--    İSTİSNA (anon korunur): RLS policy'lerinde kullanılan yardımcılar
--    ve davet-kullanım (kayıtsız davetli) fonksiyonları.
do $$
declare
  r record;
  korunan text[] := array[
    'admin_mi','kulup_sohbet_erisim','kulup_yoneticim','lig_uyesi',
    'lig_yoneticim','moderator_yetki','sohbet_yazabilir','takim_kurabilir',
    'takim_sohbet_erisim','takim_yoneticim',
    'kulup_daveti_kullan','oyuncu_daveti_kullan','takim_daveti_kullan'
  ];
begin
  for r in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
      and p.prorettype <> 'pg_catalog.trigger'::regtype
      and not (p.proname = any(korunan))
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant  execute on function %s to authenticated, service_role', r.sig);
  end loop;
end $$;
