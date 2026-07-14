-- =====================================================================
--  ForzaLig — push_abonelikleri: service_role yetkisi
--  Sorun: push-gonder Edge Function service_role ile bağlanıp
--  push_abonelikleri'nden SELECT yapıyor; ama bu proje explicit GRANT
--  kullandığından ve 18_push.sql yalnızca 'authenticated'a grant verdiğinden
--  service_role tabloyu göremiyor →
--    "permission denied for table push_abonelikleri" → abonelik sayisi 0.
--  Çözüm: service_role'e tam yetki (RLS zaten server rolünü baypas eder).
--  18_push.sql'den SONRA çalıştır. İdempotent.
-- =====================================================================

grant select, insert, update, delete on public.push_abonelikleri to service_role;
