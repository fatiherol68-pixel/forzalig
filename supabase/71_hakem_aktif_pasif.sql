-- 71_hakem_aktif_pasif.sql
-- Hakem sistemi: PASİF hakemleri maç hakem havuzundan gizle (silmeden).
--
-- Nasıl çalışır:
--   profiller.roller.hakem       = true  → kişi hakem
--   profiller.roller.hakem_pasif = true  → hakem ama şu an pasif (havuzda görünmez)
--
-- Bu dosya SADECE hakem_havuzu view'ını günceller. Kod bu güncelleme olmadan da
-- çalışır; tek fark, güncelleme yapılmazsa PASİF hakemler maç kurulumundaki
-- "Havuzdan hakem seç" listesinde de görünmeye devam eder. Aktif/Pasif ayrımı ve
-- toplu Hakem Yap/Kaldır özellikleri şema değişmeden zaten çalışır.
--
-- Idempotent — istediğin kadar çalıştırabilirsin (create or replace).

create or replace view public.hakem_havuzu as
  select user_id, ad, sehir, foto
  from public.profiller
  where roller @> '{"hakem":true}'::jsonb
    and coalesce((roller->>'hakem_pasif')::boolean, false) = false;

grant select on public.hakem_havuzu to authenticated;
