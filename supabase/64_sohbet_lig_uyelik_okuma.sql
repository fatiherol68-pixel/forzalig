-- =====================================================================
--  ForzaLig — LİG GENELİ SOHBET OKUMA: yalnız o ligin ÜYESİ görsün
--  63_sohbet_lig_uyelik.sql (lig_uyesi + yazma) çalıştırıldıktan SONRA.
--  p_sohbet_sel'in 'else true' dalı → 'else lig_uyesi(lig_id)'.
--  Takım/kulüp okuma + yazma kuralları aynen kalır. İdempotent.
--  Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

drop policy if exists p_sohbet_sel on public.sohbet_mesajlari;
create policy p_sohbet_sel on public.sohbet_mesajlari for select to authenticated
  using (
    silindi = false and (
      case
        when kulup_id is not null then public.kulup_sohbet_erisim(kulup_id)
        when takim_id is not null then public.takim_sohbet_erisim(takim_id)
        else public.lig_uyesi(lig_id)     -- ⬅️ lig geneli: yalnız o ligin üyesi okur
      end
    )
  );
