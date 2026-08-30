-- =====================================================================
--  ForzaLig — DAVET: OTOMATİK KATILIM (yönetici onayı KALDIRILDI)
--  Davet linkine tıklayıp bilgilerini giren oyuncu DOĞRUDAN kadroya
--  katılır → FIFA kartı anında oluşur. Onay beklemez.
--  İstenmeyen kişi sonradan Takımlar sayfasından çıkarılır (aşağıdaki
--  fonksiyonlar artık Süper Admin'e de izin verir).
--  25 + 57 + 58'DEN SONRA çalıştır. İdempotent. Supabase → SQL Editor → Run.
-- =====================================================================

-- 1) Oyuncu daveti → artık DOĞRUDAN aktif üyelik (bekleme/onay YOK)
create or replace function public.oyuncu_daveti_kullan(
  p_token text, p_ad text, p_no int, p_poz text, p_foto text,
  p_dogum date, p_boy int, p_kilo int, p_uyruk text, p_ayak text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_takim uuid; v_lig uuid; v_pid uuid;
begin
  select takim_id, lig_id into v_takim, v_lig from public.davetler where token=p_token and tip='oyuncu' and aktif;
  if v_takim is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
    values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
    returning player_id into v_pid;
  insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay)
    values (v_pid, v_takim, v_lig, true, 'onayli');   -- DOĞRUDAN aktif · onay yok
  return v_pid;
end $$;
grant execute on function public.oyuncu_daveti_kullan(text,text,int,text,text,date,int,int,text,text) to authenticated;

-- 2) Bekleyen (eski) katılım istekleri → hepsini otomatik onayla (geriye dönük)
--    Böylece daha önce davetle katılıp onay bekleyen herkesin kartı hemen gelir.
update public.oyuncu_takim set aktif=true, onay='onayli' where onay='bekliyor';

-- 3) ÇIKARMA yetkisi Süper Admin'e de açılsın (takım/kulüp yöneticisi VEYA admin)
--    (Buton zaten admin'e görünüyordu; artık işlem de admin için başarılı olur.)
create or replace function public.oyuncu_cikar(p_player uuid, p_takim uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_ot uuid; v_lig uuid; v_sahip uuid; v_tk text;
begin
  select id, lig_id into v_ot, v_lig from public.oyuncu_takim
    where player_id=p_player and takim_id=p_takim and aktif;
  if v_ot is null or not (public.takim_yoneticim(p_takim) or public.admin_mi()) then return false; end if;
  update public.oyuncu_takim
    set aktif=false, ayrilma=now(), ayrilma_sebep='cikarildi', ayrilma_talep=false
    where id=v_ot;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=p_player;
  select ad into v_tk from public.takimlar where id=p_takim;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'cikarildi', 'Takımdan çıkarıldın',
      coalesce(v_tk,'Takım')||' kadrosundan çıkarıldın. Geçmiş istatistiklerin korunur.',
      'turnuva', v_lig::text);
  end if;
  return true;
end $$;
grant execute on function public.oyuncu_cikar(uuid, uuid) to authenticated;

create or replace function public.kulup_oyuncu_serbest(p_kulup uuid, p_player uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_sahip uuid; v_ad text; r record;
begin
  if not (public.kulup_yoneticim(p_kulup) or public.admin_mi()) then return false; end if;
  update public.kulup_oyuncu set aktif=false where kulup_id=p_kulup and player_id=p_player;
  for r in select t.id as takim_id from public.takimlar t join public.ligler l on l.id=t.lig_id
             where t.kulup_id=p_kulup and coalesce(l.durum,'aktif')<>'arsiv' loop
    update public.oyuncu_takim set aktif=false, ayrilma=now(), ayrilma_sebep='cikarildi'
      where player_id=p_player and takim_id=r.takim_id and aktif;
  end loop;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=p_player;
  select ad into v_ad from public.kulupler where id=p_kulup;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'cikarildi', 'Takımdan çıkarıldın',
      coalesce(v_ad,'Takım')||' takımından çıkarıldın. Geçmiş istatistiklerin korunur.', 'profil', null);
  end if;
  return true;
end $$;
grant execute on function public.kulup_oyuncu_serbest(uuid, uuid) to authenticated;
