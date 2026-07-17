-- =====================================================================
--  ForzaLig — Bildirim kuyruğuna doğrudan e-posta hedefi (admin kopyası)
--  Her giden e-postanın bir kopyası fatiherol68@gmail.com'a gitsin diye.
--  45_bildirim_merkezi.sql'den SONRA. Bir kez çalıştır. İdempotent.
-- =====================================================================
alter table public.bildirim_kuyruk add column if not exists hedef_email text;
-- =====================================================================
