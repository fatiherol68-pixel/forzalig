-- =====================================================================
--  ForzaLig — Lig Kuralları alanı (Kurallar sekmesi)
--  Lig yöneticisi kuralları yazar/yapıştırır, herkes düzenli görür.
--  Yazma izni: mevcut p_lig_upd (lig_yoneticim = yönetici/yardımcı/admin).
--  Bir kez çalıştır. İdempotent.
-- =====================================================================
alter table public.ligler add column if not exists kurallar text;
