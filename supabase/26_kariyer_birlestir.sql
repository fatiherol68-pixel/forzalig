-- =====================================================================
--  ForzaLig — KARİYER BİRLEŞTİRME (#12-14)
--  Oyuncu daveti artık her seferinde YENİ kart açmaz:
--   - Kullanıcının zaten bir kariyeri (oyuncu kartı) varsa ona bağlanır.
--   - Yoksa yeni kart açılır.
--   - Aynı ligde zaten bir takımdaysa: katılım değil TRANSFER gerekir (engellenir).
--  25_davet_onay.sql'den SONRA çalıştır. Nasıl: SQL Editor → yapıştır → Run.
-- =====================================================================

create or replace function public.oyuncu_daveti_kullan(
  p_token text, p_ad text, p_no int, p_poz text, p_foto text,
  p_dogum date, p_boy int, p_kilo int, p_uyruk text, p_ayak text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_takim uuid; v_lig uuid; v_pid uuid;
begin
  select takim_id, lig_id into v_takim, v_lig from public.davetler where token=p_token and tip='oyuncu' and aktif;
  if v_takim is null then raise exception 'Geçersiz veya kapalı davet'; end if;

  -- Kullanıcının mevcut kariyeri (oyuncu kartı) var mı?
  select player_id into v_pid from public.oyuncular where sahip_user_id = auth.uid() order by olusturma asc limit 1;

  if v_pid is null then
    -- Yoksa yeni kariyer aç
    insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
      values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
      returning player_id into v_pid;
  else
    -- Var olan kariyere fotoğraf boşsa doldur (bilgiyi ezmeyiz)
    update public.oyuncular set foto = coalesce(foto, p_foto), poz = coalesce(poz, p_poz)
      where player_id = v_pid;
  end if;

  -- Aynı ligde zaten aktif/bekleyen üyelik varsa: katılım değil transfer gerekir
  if exists(select 1 from public.oyuncu_takim where player_id=v_pid and lig_id=v_lig and (aktif or onay='bekliyor')) then
    raise exception 'Bu ligde zaten bir takımdasın. Takım değişikliği için transfer süreci gerekir.';
  end if;

  -- Yeni takım üyeliği (yönetici onayına düşer)
  insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay)
    values (v_pid, v_takim, v_lig, false, 'bekliyor');
  return v_pid;
end $$;
grant execute on function public.oyuncu_daveti_kullan(text,text,int,text,text,date,int,int,text,text) to authenticated;
