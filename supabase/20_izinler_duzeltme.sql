-- =====================================================================
--  ForzaLig — İZİN DÜZELTME (16-19 zaten çalıştırıldıysa BUNU da çalıştır)
--  "permission denied for table ..." hatasını giderir.
--  Bu proje explicit GRANT kullanır; yeni tablolara GRANT eklenmemişti.
-- =====================================================================

grant select, update, delete on public.bildirimler to authenticated;
grant select, insert, update, delete on public.sohbet_mesajlari to authenticated;
grant select, insert, delete on public.push_abonelikleri to authenticated;

-- Pazar RPC'leri: lig yöneticisi de oyuncuyu müsait yapabilsin + execute izni
create or replace function public.oyuncu_musait_ayar(
  p_player_id uuid, p_musait boolean, p_sehir text default null, p_not text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_sahip uuid; v_yetkili boolean := false;
begin
  select sahip_user_id into v_sahip from public.oyuncular where player_id = p_player_id;
  if v_sahip is not null and v_sahip = auth.uid() then
    v_yetkili := true;
  else
    select exists(
      select 1 from public.oyuncu_takim ot
      join public.ligler g on g.id = ot.lig_id
      where ot.player_id = p_player_id and ot.aktif
        and (public.admin_mi() or g.yonetici_id = auth.uid())
    ) into v_yetkili;
  end if;
  if not v_yetkili then return false; end if;
  update public.oyuncular
    set musait = p_musait,
        musait_sehir = case when p_musait then p_sehir else null end,
        musait_not   = case when p_musait then p_not   else null end,
        musait_t     = case when p_musait then now()   else null end
    where player_id = p_player_id;
  return true;
end $$;
grant execute on function public.oyuncu_musait_ayar(uuid, boolean, text, text) to authenticated;
grant execute on function public.pazar_oyuncular(text) to anon, authenticated;
