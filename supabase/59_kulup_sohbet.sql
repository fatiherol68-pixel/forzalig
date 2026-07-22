-- =====================================================================
--  ForzaLig — KULÜP (TAKIM) SOHBETİ — lig gerektirmez
--  Her takımın kendi sohbet odası. Sadece o takımın kadrosundaki oyuncular
--  (kendi hesabıyla) + takım sahibi + Süper Admin erişir. Lig sohbeti aynen kalır.
--  17/21/23'ten SONRA çalıştır. İdempotent. Supabase → Run.
-- =====================================================================

-- lig_id artık zorunlu değil (kulüp sohbeti lige bağlı değil) + kulup_id kanalı
alter table public.sohbet_mesajlari alter column lig_id drop not null;
alter table public.sohbet_mesajlari add column if not exists kulup_id uuid references public.kulupler(id) on delete cascade;
create index if not exists ix_sohbet_kulup on public.sohbet_mesajlari(kulup_id, olusma);

-- Kulüp sohbetine erişim: kadroda aktif oyuncusu olan üye (kendi hesabı) VEYA sahip/admin
create or replace function public.kulup_sohbet_erisim(k uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.kulup_yoneticim(k)
    or exists(
      select 1 from public.kulup_oyuncu ko
      join public.oyuncular o on o.player_id = ko.player_id
      where ko.kulup_id = k and ko.aktif and o.sahip_user_id = auth.uid()
    );
$$;
grant execute on function public.kulup_sohbet_erisim(uuid) to authenticated;

-- OKUMA: kulüp kanalı → erişim kontrolü; değilse eski mantık (lig geneli / takım)
drop policy if exists p_sohbet_sel on public.sohbet_mesajlari;
create policy p_sohbet_sel on public.sohbet_mesajlari for select to authenticated
  using (
    silindi = false and (
      case
        when kulup_id is not null then public.kulup_sohbet_erisim(kulup_id)
        when takim_id is not null then public.takim_sohbet_erisim(takim_id)
        else true
      end
    )
  );

-- YAZMA: kendi user_id'sinle; kanala göre erişim
drop policy if exists p_sohbet_ins on public.sohbet_mesajlari;
create policy p_sohbet_ins on public.sohbet_mesajlari for insert to authenticated
  with check (
    user_id = auth.uid() and (
      case
        when kulup_id is not null then public.kulup_sohbet_erisim(kulup_id)
        when takim_id is not null then public.takim_sohbet_erisim(takim_id)
        else true
      end
    )
  );

-- =====================================================================
--  Not: Lig sohbeti (lig_id dolu, kulup_id null) aynen çalışır. Kulüp
--  sohbeti mesajları lig_id=null, kulup_id dolu olarak saklanır.
-- =====================================================================
