-- ForzaLig — FAZ 1 (tamamlama): davet bağlantılarına 30 gün geçerlilik
-- Sızmış/eski davet token'ları sonsuza dek çalışmasın. Mekanik olarak
-- canlı fonksiyon tanımlarına 'created > now()-30 gün' eklendi.
-- Geri dönüş: *_rollback.sql (interval kaldırır).

CREATE OR REPLACE FUNCTION public.kulup_daveti_kullan(p_token text, p_ad text, p_no integer, p_poz text, p_foto text, p_dogum date, p_boy integer, p_kilo integer, p_uyruk text, p_ayak text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_kulup uuid; v_pid uuid;
begin
  select kulup_id into v_kulup from public.davetler where token=p_token and tip='kulup' and aktif and created > now() - interval '30 days';
  if v_kulup is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
    values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
    returning player_id into v_pid;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
    values (v_kulup, v_pid, p_no, p_poz, true) on conflict (kulup_id, player_id) do nothing;
  return v_pid;
end $function$;

CREATE OR REPLACE FUNCTION public.takim_daveti_kullan(p_token text, p_ad text, p_renk text, p_renk2 text, p_logo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_lig uuid; v_id uuid; v_oy_token text;
begin
  select lig_id into v_lig from public.davetler where token=p_token and tip='takim' and aktif and created > now() - interval '30 days';
  if v_lig is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.takimlar(lig_id, ad, renk, renk2, logo, yonetici_id)
    values (v_lig, coalesce(nullif(trim(p_ad),''),'Yeni Takım'), p_renk, p_renk2, p_logo, auth.uid())
    returning id into v_id;
  insert into public.davetler(lig_id, takim_id, tip, olusturan)
    values (v_lig, v_id, 'oyuncu', auth.uid())
    returning token into v_oy_token;
  return jsonb_build_object('takim_id', v_id, 'oyuncu_token', v_oy_token);
end $function$;

CREATE OR REPLACE FUNCTION public.oyuncu_daveti_kullan(p_token text, p_ad text, p_no integer, p_poz text, p_foto text, p_dogum date, p_boy integer, p_kilo integer, p_uyruk text, p_ayak text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid; v_lig uuid; v_pid uuid;
begin
  select takim_id, lig_id into v_takim, v_lig from public.davetler where token=p_token and tip='oyuncu' and aktif and created > now() - interval '30 days';
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
end $function$;
