-- =====================================================================
--  ForzaLig — "HAYALİ ÜYE" TEMİZLİĞİ  (öksüz profiller)
--  ---------------------------------------------------------------------
--  SORUN: Admin panelindeki "Üyeler" listesi public.profiller tablosundan
--  okunur. Zamanla profiller'de, karşılığında auth.users HESABI OLMAYAN
--  "öksüz" (orphan) satırlar birikmiş. Panelin silme butonları YALNIZCA
--  auth.users'tan siler (delete from auth.users…); öksüz profillerin
--  auth.users'ta karşılığı olmadığı için hiçbir silme onlara dokunmaz →
--  her yenilemede "hayali üyeler yine çıkıyor".
--
--  ÇÖZÜM: (1) öksüz profilleri doğrudan sil, (2) FK cascade'i garanti et
--  (bir daha oluşmasın), (3) "🧹 toplu temizle" fonksiyonunu öksüzleri de
--  temizleyecek şekilde güncelle.
--
--  GÜVENLİ: Yalnız auth.users KARŞILIĞI OLMAYAN profiller silinir.
--  Gerçek hesapların (Google/e-posta) ve adminler ETKİLENMEZ.
--  Nasıl: Supabase → SQL Editor → hepsini yapıştır → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TEŞHİS — çalıştırmadan önce durumu gör
--    (kac_gercek = auth.users'taki hesap sayısı,
--     kac_profil = profiller satırı, kac_hayali = öksüz/hayali üye)
-- ---------------------------------------------------------------------
select
  (select count(*) from auth.users)                                          as kac_gercek_hesap,
  (select count(*) from public.profiller)                                    as kac_profil,
  (select count(*) from public.profiller p
     where not exists (select 1 from auth.users u where u.id = p.user_id))   as kac_hayali;

-- (İstersen hayali satırları listele:)
-- select p.user_id, p.email, p.ad, p.created
--   from public.profiller p
--   where not exists (select 1 from auth.users u where u.id = p.user_id)
--   order by p.created desc;

-- ---------------------------------------------------------------------
-- 2) TEMİZLİK — öksüz (hayali) profilleri sil. Gerçek hesaplar korunur.
-- ---------------------------------------------------------------------
delete from public.profiller p
 where not exists (select 1 from auth.users u where u.id = p.user_id);

-- ---------------------------------------------------------------------
-- 3) KALICI ÖNLEM — FK cascade'i garanti et.
--    Böylece bir hesap silindiğinde profili de otomatik silinir;
--    profiller'e auth.users'ta olmayan bir user_id EKLENEMEZ (öksüz kalmaz).
-- ---------------------------------------------------------------------
alter table public.profiller drop constraint if exists profiller_user_id_fkey;
alter table public.profiller
  add  constraint profiller_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- ---------------------------------------------------------------------
-- 4) "🧹 Toplu temizle" butonunu GÜÇLENDİR
--    Artık: anonim + @forzalig.com + @forzalig.test hesapları SİLER,
--    AYRICA öksüz profilleri temizler. (adminler ve çağıran KORUNUR)
--    Panel bu RPC'yi zaten çağırıyor — frontend değişikliği gerekmez.
-- ---------------------------------------------------------------------
create or replace function public.uyeler_temizle_admin()
returns integer language plpgsql security definer set search_path = public as $$
declare v_auth integer; v_orphan integer;
begin
  if not public.admin_mi() then raise exception 'Yetki yok: yalnızca süper admin.'; end if;

  -- a) Anonim / test uzantılı GERÇEK hesaplar (adminler ve sen hariç)
  with d as (
    delete from auth.users u
     where ( coalesce(u.is_anonymous, false) = true
             or u.email ilike '%@forzalig.com'
             or u.email ilike '%@forzalig.test' )
       and u.id <> auth.uid()
       and not exists (select 1 from public.adminler a where a.user_id = u.id)
    returning 1
  )
  select count(*) into v_auth from d;

  -- b) Öksüz (hayali) profiller
  with o as (
    delete from public.profiller p
     where not exists (select 1 from auth.users u where u.id = p.user_id)
    returning 1
  )
  select count(*) into v_orphan from o;

  return v_auth + v_orphan;
end $$;
grant execute on function public.uyeler_temizle_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 5) KONTROL — kac_hayali artık 0 olmalı; kac_profil = kac_gercek_hesap
-- ---------------------------------------------------------------------
select
  (select count(*) from auth.users)                                          as kac_gercek_hesap,
  (select count(*) from public.profiller)                                    as kac_profil,
  (select count(*) from public.profiller p
     where not exists (select 1 from auth.users u where u.id = p.user_id))   as kac_hayali;
