-- 71_hakem_aktif_pasif.sql
-- Hakem sistemi — hakem havuzu view'ını güncelle:
--   1) PASİF hakemleri havuzdan gizle (roller.hakem_pasif = true)
--   2) Her hakemin atandığı LİGLERİ (roller.hakem_ligler) döndür → maç kurulumunda
--      hakem, yalnızca atandığı ligin maçlarında listede çıkar. (Boş = tüm ligler.)
--
-- Kod bu güncelleme olmadan da çalışır (havuz okuma dayanıklıdır); güncelleme yoksa
-- sadece pasif hakemler ve lig filtresi devreye girmez. Aktif/Pasif ayrımı, toplu
-- Hakem Yap/Kaldır ve lig atama ekranı şema değişmeden zaten çalışır.
--
-- Idempotent — istediğin kadar çalıştırabilirsin.

create or replace view public.hakem_havuzu as
  select
    user_id,
    ad,
    sehir,
    foto,
    coalesce(roller->'hakem_ligler', '[]'::jsonb) as ligler
  from public.profiller
  where roller @> '{"hakem":true}'::jsonb
    and coalesce((roller->>'hakem_pasif')::boolean, false) = false;

grant select on public.hakem_havuzu to authenticated;
