-- =====================================================================
--  ForzaLig — ADMIN TOPLU BİLDİRİM (duyuru gönderme)
--  Süper admin; herkese / bir lige / bir takıma / tek kişiye bildirim yollar.
--  Bildirim, mevcut "bildirimler" tablosuna düşer (kullanıcının çanında görünür).
--  Güvenli: SECURITY DEFINER + admin_mi() kontrolü. 16_bildirimler.sql'den SONRA.
--  Nasıl: Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

create or replace function public.admin_toplu_bildirim(
  p_tip text, p_id uuid, p_baslik text, p_metin text)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int := 0;
begin
  if not public.admin_mi() then raise exception 'Yetkisiz — sadece süper admin.'; end if;
  if p_baslik is null or length(trim(p_baslik)) = 0 then raise exception 'Başlık gerekli.'; end if;

  if p_tip = 'herkes' then
    insert into public.bildirimler(user_id, tip, baslik, metin)
      select user_id, 'duyuru', p_baslik, p_metin from public.profiller;
    get diagnostics v_count = row_count;

  elsif p_tip = 'kisi' then
    if p_id is null then raise exception 'Kişi seçilmedi.'; end if;
    insert into public.bildirimler(user_id, tip, baslik, metin)
      values (p_id, 'duyuru', p_baslik, p_metin);
    v_count := 1;

  elsif p_tip = 'lig' then
    if p_id is null then raise exception 'Lig seçilmedi.'; end if;
    -- ligdeki oyuncuların sahipleri
    insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id)
      select distinct o.sahip_user_id, 'duyuru', p_baslik, p_metin, 'turnuva', p_id::text
      from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id = ot.player_id
      where ot.lig_id = p_id and ot.aktif and o.sahip_user_id is not null;
    get diagnostics v_count = row_count;
    -- lig yöneticisi de haberdar olsun
    insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id)
      select g.yonetici_id, 'duyuru', p_baslik, p_metin, 'turnuva', p_id::text
      from public.ligler g where g.id = p_id and g.yonetici_id is not null;

  elsif p_tip = 'takim' then
    if p_id is null then raise exception 'Takım seçilmedi.'; end if;
    insert into public.bildirimler(user_id, tip, baslik, metin)
      select distinct o.sahip_user_id, 'duyuru', p_baslik, p_metin
      from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id = ot.player_id
      where ot.takim_id = p_id and ot.aktif and o.sahip_user_id is not null;
    get diagnostics v_count = row_count;

  else
    raise exception 'Geçersiz hedef tipi.';
  end if;

  return v_count;
end $$;

grant execute on function public.admin_toplu_bildirim(text, uuid, text, text) to authenticated;
