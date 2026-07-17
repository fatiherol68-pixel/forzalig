-- =====================================================================
--  ForzaLig — LİG'İ HEMEN KALICI SİL (tam cascade)
--  "Kalıcı Sil" artık 90 gün beklemez; anında tüm bağlı veriyi siler.
--  Siler: lig, takımlar, oyuncu_takım, maçlar (+olay/ödül/ilk11/katılım),
--         transferler, sohbet, davetler, yardımcılar, lige özel oyuncular,
--         lige bağlı bildirimler.
--  Güvenlik: yalnızca Süper Admin. security definer. İdempotent.
--  Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================
create or replace function public.lig_kalici_sil(p_lig uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_players uuid[];
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz';
  end if;

  -- Bu lige ÖZEL oyuncular (başka ligde aktif üyeliği olmayanlar) — öksüz kalmasın
  select coalesce(array_agg(distinct ot.player_id), '{}') into v_players
    from public.oyuncu_takim ot
   where ot.lig_id = p_lig
     and not exists (select 1 from public.oyuncu_takim o2
                      where o2.player_id = ot.player_id and o2.lig_id <> p_lig);

  -- Lige bağlı bildirimler (link_tip='turnuva')
  begin
    delete from public.bildirimler where link_tip = 'turnuva' and link_id = p_lig::text;
  exception when others then null; end;

  -- FK cascade'i olmayanları elle sil
  delete from public.maclar      where lig_id = p_lig;   -- cascade: mac_olaylari/mac_odulleri/ilk11/katilim
  delete from public.transferler where lig_id = p_lig;   -- (ligler'e cascade yok)

  -- Ligi sil → cascade: takimlar, oyuncu_takim, sohbet_mesajlari, davetler, lig_yardimci
  delete from public.ligler where id = p_lig;

  -- Öksüz oyuncuları sil
  begin
    if array_length(v_players,1) is not null then
      delete from public.oyuncular where player_id = any(v_players);
    end if;
  exception when others then null; end;
end $$;

grant execute on function public.lig_kalici_sil(uuid) to authenticated;

-- Test:  select public.lig_kalici_sil('LIG_UUID');
-- =====================================================================
