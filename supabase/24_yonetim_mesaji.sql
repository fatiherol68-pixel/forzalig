-- =====================================================================
--  ForzaLig — YÖNETİM MESAJI koruması
--  "yonetim=true" mesajı sadece lig yöneticisi/admin gönderebilsin.
--  Böylece normal kullanıcı sahte "FORZALİG YÖNETİMİ" mesajı yazamaz.
--  17 + 21 + 23'ten SONRA çalıştır. Nasıl: SQL Editor → yapıştır → Run.
-- =====================================================================

drop policy if exists p_sohbet_ins on public.sohbet_mesajlari;
create policy p_sohbet_ins on public.sohbet_mesajlari for insert to authenticated
  with check (
    user_id = auth.uid()
    and (takim_id is null or public.takim_sohbet_erisim(takim_id))
    and (yonetim = false or public.lig_yoneticim(lig_id))
  );
