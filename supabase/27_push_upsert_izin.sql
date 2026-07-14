-- =====================================================================
--  ForzaLig — PUSH abonelik UPSERT izni düzeltmesi
--  Sorun: client push_abonelikleri'ne .upsert() (INSERT ... ON CONFLICT
--  DO UPDATE) yapıyor. Bunun "güncelle" kısmı UPDATE yetkisi ister; ama
--  18_push.sql yalnızca select/insert/delete verdi → "permission denied
--  for table push_abonelikleri" hatası.
--  Çözüm: UPDATE grant'i + kendi satırını güncelleme RLS politikası.
--  18_push.sql'den SONRA çalıştır. Tekrar çalıştırmak güvenli (idempotent).
-- =====================================================================

-- 1) Tablo düzeyi UPDATE yetkisi (bu proje explicit GRANT kullanır)
grant update on public.push_abonelikleri to authenticated;

-- 2) Satır düzeyi: kullanıcı sadece KENDİ aboneliğini güncelleyebilir.
--    (upsert conflict ile aynı endpoint'e denk gelince user_id yine kendisi.)
drop policy if exists p_push_upd on public.push_abonelikleri;
create policy p_push_upd on public.push_abonelikleri for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
