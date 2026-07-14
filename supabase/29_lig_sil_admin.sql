-- =====================================================================
--  ForzaLig — Süper Admin: ligi ve TÜM verisini kalıcı sil
--  ligler silinince şema cascade ile takimlar / oyuncu_takim / maclar /
--  mac_olaylari vb. gider; AMA oyuncular (player) satırları sahipsiz kalır.
--  Bu fonksiyon: bu lige ÖZGÜ oyuncuları da (başka ligde üyeliği yoksa)
--  temizler, sonra ligi siler. Sadece admin_mi() çağırabilir.
--  02_guvenlik.sql'den (admin_mi) SONRA çalıştır. İdempotent.
-- =====================================================================

create or replace function public.lig_sil_admin(p_lig uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_mi() then
    raise exception 'yetkisiz: sadece süper admin';
  end if;

  -- Yalnızca bu ligde üyeliği olan ve BAŞKA ligde üyeliği olmayan oyuncuları sil.
  -- (oyuncular silinince oyuncu_takim satırları cascade ile gider.)
  delete from public.oyuncular o
   where exists (select 1 from public.oyuncu_takim ot
                  where ot.player_id = o.player_id and ot.lig_id = p_lig)
     and not exists (select 1 from public.oyuncu_takim ot2
                      where ot2.player_id = o.player_id and ot2.lig_id <> p_lig);

  -- Ligi sil → takimlar / oyuncu_takim / maclar / mac_olaylari cascade gider.
  delete from public.ligler where id = p_lig;
end $$;

grant execute on function public.lig_sil_admin(uuid) to authenticated;
