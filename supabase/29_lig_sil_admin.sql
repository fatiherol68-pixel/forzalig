-- =====================================================================
--  ForzaLig — Süper Admin: ligi ve TÜM verisini kalıcı sil  (v3)
--  Cascade sırası sorununu kökten çözer: mac_olaylari/mac_odulleri/ilk11
--  vb. hepsi mac_id ON DELETE CASCADE. O yüzden ÖNCE maçları silersek bu
--  child tablolar (takim_id / player_id referansları dahil) temizlenir;
--  sonra lig silinince takimlar & oyuncu_takim rahatça gider.
--  SIRA: maçlar → transferler → lig → oyuncular(best-effort).
--  Sadece admin_mi() çağırabilir. 02_guvenlik.sql'den SONRA. İdempotent.
-- =====================================================================

create or replace function public.lig_sil_admin(p_lig uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_players uuid[];
begin
  if not public.admin_mi() then
    raise exception 'yetkisiz: sadece süper admin';
  end if;

  -- Bu lige özgü (başka ligde üyeliği olmayan) oyuncuları ÖNCE yakala.
  select coalesce(array_agg(distinct ot.player_id), '{}')
    into v_players
    from public.oyuncu_takim ot
   where ot.lig_id = p_lig
     and not exists (select 1 from public.oyuncu_takim o2
                      where o2.player_id = ot.player_id and o2.lig_id <> p_lig);

  -- 1) MAÇLARI sil → mac_olaylari / mac_odulleri / ilk11 / mac_sonuc_log ...
  --    (hepsi mac_id ON DELETE CASCADE) temizlenir; takım/oyuncu referansları kalmaz.
  delete from public.maclar where lig_id = p_lig;

  -- 2) Transferler (lig_id cascade DEĞİL) elle temizle.
  delete from public.transferler where lig_id = p_lig;

  -- 3) Ligi sil → takimlar + oyuncu_takim cascade gider.
  delete from public.ligler where id = p_lig;

  -- 4) Lige özgü oyuncular (referansları temizlendi) — best-effort:
  --    takılırsa ligi silmeyi geri alma.
  begin
    if array_length(v_players, 1) is not null then
      delete from public.oyuncular where player_id = any(v_players);
    end if;
  exception when others then
    null;
  end;
end $$;

grant execute on function public.lig_sil_admin(uuid) to authenticated;
