-- =====================================================================
--  ForzaLig — TAKIM SOHBETİ takımın TÜM oyuncularına açılıyor
--  Önceden: takım kanalını sadece kaptan (takim_yoneticim) okuyup yazabiliyordu.
--  Şimdi: o takımda AKTİF oyuncusu (sahiplendiği kart) olan üye de erişebilir.
--  Başka takımın üyeleri erişemez (izolasyon korunur).
--  Nasıl: Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

-- Yardımcı: bu takımın sohbetine erişebilir miyim?
--  (kaptan/lig yön./admin  VEYA  bu takımda aktif oyuncum var)
create or replace function public.takim_sohbet_erisim(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.takim_yoneticim(t)
    or exists(
      select 1 from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id = ot.player_id
      where ot.takim_id = t and ot.aktif and o.sahip_user_id = auth.uid()
    );
$$;

-- OKUMA: lig geneli herkese; takım kanalı sadece o takıma erişebilenlere
drop policy if exists p_sohbet_sel on public.sohbet_mesajlari;
create policy p_sohbet_sel on public.sohbet_mesajlari for select to authenticated
  using (
    silindi = false and (
      takim_id is null
      or public.takim_sohbet_erisim(takim_id)
    )
  );

-- YAZMA: kendi user_id'siyle; lig geneli herkes, takım kanalı sadece erişebilen
drop policy if exists p_sohbet_ins on public.sohbet_mesajlari;
create policy p_sohbet_ins on public.sohbet_mesajlari for insert to authenticated
  with check (
    user_id = auth.uid() and (
      takim_id is null
      or public.takim_sohbet_erisim(takim_id)
    )
  );
