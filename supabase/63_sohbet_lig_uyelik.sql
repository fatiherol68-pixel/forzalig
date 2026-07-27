-- =====================================================================
--  ForzaLig — LİG GENELİ SOHBET: yalnız o ligin ÜYESİ yazabilir
--  SORUN: 59_kulup_sohbet.sql'deki p_sohbet_ins politikasında lig geneli
--  kanal (kulup_id null + takim_id null) için 'else true' vardı → giriş
--  yapan HERKES herhangi bir ligin genel sohbetine yazabiliyordu.
--  ÇÖZÜM: lig geneline yazmak için public.lig_uyesi(lig_id) şartı.
--  Takım/kulüp kanalları aynen kalır. Okuma değişmez. İdempotent.
--  Supabase → SQL Editor → yapıştır → Run.  59'dan SONRA çalıştır.
-- =====================================================================

-- Kişi bu ligin üyesi mi? (kendi hesabıyla aktif oyuncusu var / kaptan / lig yön. / admin)
create or replace function public.lig_uyesi(l uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.admin_mi()
    or public.lig_yoneticim(l)
    or exists (select 1 from public.takimlar t
                where t.lig_id = l and t.yonetici_id = auth.uid())
    or exists (select 1 from public.oyuncu_takim ot
                 join public.oyuncular o on o.player_id = ot.player_id
                where ot.lig_id = l and ot.aktif and o.sahip_user_id = auth.uid());
$$;
grant execute on function public.lig_uyesi(uuid) to authenticated;

-- YAZMA: kendi user_id'sinle; kanala göre erişim (yalnız 'else' dalı değişti)
drop policy if exists p_sohbet_ins on public.sohbet_mesajlari;
create policy p_sohbet_ins on public.sohbet_mesajlari for insert to authenticated
  with check (
    user_id = auth.uid() and (
      case
        when kulup_id is not null then public.kulup_sohbet_erisim(kulup_id)
        when takim_id is not null then public.takim_sohbet_erisim(takim_id)
        else public.lig_uyesi(lig_id)     -- ⬅️ lig geneli: yalnız o ligin üyesi
      end
    )
  );

-- =====================================================================
--  Not: Okuma (p_sohbet_sel) değişmedi — lig geneli hâlâ görüntülenebilir.
--  Sadece GÖRÜNTÜLEMEYİ de üyelerle sınırlamak istersen bana söyle.
-- =====================================================================
