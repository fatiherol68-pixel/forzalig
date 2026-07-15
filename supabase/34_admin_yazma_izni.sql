-- =====================================================================
--  ForzaLig — ADMIN YAZMA İZNİ DÜZELTMESİ
--  Sorun: adminler ve lig_haklari tablolarına sadece SELECT grant'i vardı;
--  admin bir kullanıcıyı admin yapınca / lig hakkı verince
--  "permission denied for table adminler" hatası.
--  Çözüm: INSERT/UPDATE/DELETE grant'i. RLS (admin_mi()) zaten sadece
--  adminlerin yazmasına izin veriyor — güvenli.
--  Bir kez çalıştır. Idempotent.
-- =====================================================================

grant insert, update, delete on public.adminler    to authenticated;
grant insert, update, delete on public.lig_haklari to authenticated;
