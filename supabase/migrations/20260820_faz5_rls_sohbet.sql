-- ForzaLig — FAZ 5: RLS sertleştirme (sohbet mesaj güncelleme WITH CHECK)
-- Uygulanma: Supabase apply_migration (canlı) — 2026-08-20
--
-- Sorun: p_sohbet_upd politikasının USING'i zaten kısıtlıydı
--   (yalnız sahip / lig yöneticisi / admin bir satırı HEDEFLEYEBİLİR),
--   ama WITH CHECK (true) idi → hedefleyebilen kişi, güncellenen satıra
--   İSTEDİĞİ değerleri yazabiliyordu (ör. user_id/lig_id/takim_id
--   değiştirme, sahiplik taşıma). Bu bir bütünlük açığıdır.
--
-- Çözüm (MİNİMAL, davranış korur): WITH CHECK'i USING ile AYNI yap.
--   KİMİN hangi satırı güncelleyebileceği DEĞİŞMEZ (lig yardımcıları dahil
--   mevcut moderasyon aynı kalır); yalnız "yeni değerler de aynı yetkiyi
--   sağlamalı" kuralı eklenir → sahiplik/kapsam kurcalama engellenir.
--
-- Yerelde kanıtlandı: sahip=1, lig yöneticisi=1, sıradan üye=0; alan
-- kurcalama (user_id değiştirme) artık WITH CHECK'e takılır.
-- Production tasarımı DEĞİŞMEZ. Geri dönüş: *_rollback.sql

alter policy "p_sohbet_upd" on public.sohbet_mesajlari
  with check ( (user_id = auth.uid()) or public.lig_yoneticim(lig_id) or public.admin_mi() );
