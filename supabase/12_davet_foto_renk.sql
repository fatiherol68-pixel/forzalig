-- =====================================================================
--  ForzaLig — DAVET ZİNCİRİ v2 (2 renk + logo + oyuncu fotoğrafı/profili)
--  Kaptan takım kurar (ad + 2 renk + logo) → otomatik oyuncu davet linki döner.
--  Oyuncu Google ile giriş yapıp tam profil + fotoğraf girer.
--  ÖNCE 11_foto_storage.sql çalıştırılmış olmalı (foto/logo/renk2 sütunları).
--  Nasıl: Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

-- Eski imzaları kaldır (yeni parametreli sürümlerle çakışmasın)
drop function if exists public.takim_daveti_kullan(text, text);
drop function if exists public.oyuncu_daveti_kullan(text, text, int);

-- ---- Takım davetini kullan → yeni takım (2 renk + logo) + otomatik oyuncu davet linki ----
create or replace function public.takim_daveti_kullan(
  p_token text, p_ad text, p_renk text, p_renk2 text, p_logo text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_lig uuid; v_id uuid; v_oy_token text;
begin
  select lig_id into v_lig from public.davetler where token=p_token and tip='takim' and aktif;
  if v_lig is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.takimlar(lig_id, ad, renk, renk2, logo, yonetici_id)
    values (v_lig, coalesce(nullif(trim(p_ad),''),'Yeni Takım'), p_renk, p_renk2, p_logo, auth.uid())
    returning id into v_id;
  -- bu takım için oyuncu davet linki üret (kaptan oyunculara gönderecek)
  insert into public.davetler(lig_id, takim_id, tip, olusturan)
    values (v_lig, v_id, 'oyuncu', auth.uid())
    returning token into v_oy_token;
  return jsonb_build_object('takim_id', v_id, 'oyuncu_token', v_oy_token);
end $$;

-- ---- Oyuncu davetini kullan → oyuncu + tam profil + fotoğraf + üyelik ----
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
  insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif) values (v_pid, v_takim, v_lig, true);
  return v_pid;
end $$;

grant execute on function public.takim_daveti_kullan(text,text,text,text,text) to authenticated;
grant execute on function public.oyuncu_daveti_kullan(text,text,int,text,text,date,int,int,text,text) to authenticated;

-- KONTROL — fonksiyonlar oluştu mu (2 satır dönmeli)
select proname, pg_get_function_identity_arguments(oid) as parametreler
from pg_proc where proname in ('takim_daveti_kullan','oyuncu_daveti_kullan');
