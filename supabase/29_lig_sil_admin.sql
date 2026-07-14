-- =====================================================================
--  ForzaLig — Süper Admin: ligi ve TÜM verisini kalıcı sil  (v2)
--  ligler silinince cascade: takimlar, oyuncu_takim, maclar, mac_olaylari,
--  mac_odulleri, ilk11... gider. AMA:
--   - transferler.lig_id cascade DEĞİL → önce elle silinmeli (yoksa lig
--     silinemez).
--   - oyuncular satırları maç olaylarına bağlı → lig silinmeden önce
--     silinemez. O yüzden SIRA: transferler → ligi sil → sonra oyuncular.
--   - oyuncu temizliği takılırsa lig silme GERİ ALINMASIN (best-effort).
--  Sadece admin_mi() çağırabilir. 02_guvenlik.sql'den SONRA. İdempotent.
-- =====================================================================

create or replace function public.lig_sil_admin(p_lig uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_players uuid[];
begin
  if not public.admin_mi() then
    raise exception 'yetkisiz: sadece süper admin';
  end if;

  -- Bu lige özgü (başka ligde üyeliği olmayan) oyuncu id'lerini ÖNCE yakala
  -- (oyuncu_takim satırları lig silinince cascade ile kaybolacağı için).
  select coalesce(array_agg(distinct ot.player_id), '{}')
    into v_players
    from public.oyuncu_takim ot
   where ot.lig_id = p_lig
     and not exists (select 1 from public.oyuncu_takim o2
                      where o2.player_id = ot.player_id and o2.lig_id <> p_lig);

  -- 1) Cascade OLMAYAN doğrudan referans: transferler
  delete from public.transferler where lig_id = p_lig;

  -- 2) Ligi sil → takimlar / oyuncu_takim / maclar / mac_olaylari / mac_odulleri / ilk11 cascade gider
  delete from public.ligler where id = p_lig;

  -- 3) Lige özgü oyuncular — maç olayları artık silindi, güvenle sil.
  --    Takılırsa (beklenmedik bir referans) ligi silmeyi geri alma.
  begin
    if array_length(v_players, 1) is not null then
      delete from public.oyuncular where player_id = any(v_players);
    end if;
  exception when others then
    null;
  end;
end $$;

grant execute on function public.lig_sil_admin(uuid) to authenticated;
