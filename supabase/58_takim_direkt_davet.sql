-- =====================================================================
--  ForzaLig — TAKIMA DİREKT DAVET (lig gerektirmez) + TAKIMDAN SERBEST BIRAK
--  Akış: Takım kur → takım sayfası → davet linki → oyuncu profiliyle
--  kalıcı kadroya kayıt olur. Sonra takım lige eklenince oyuncular gelir.
--  + Takım sayfasından oyuncuyu çıkar → serbest kalır, istatistik korunur.
--  48/49/54/57'den SONRA çalıştır. İdempotent. Supabase → Run.
-- =====================================================================

-- 1) davetler'e kulüp bağı (lig_id null olabilir artık — takım daveti lig istemez)
alter table public.davetler add column if not exists kulup_id uuid references public.kulupler(id) on delete cascade;
create index if not exists ix_davet_kulup on public.davetler(kulup_id);

-- Davet oluşturma izni: lig yöneticisi (eski) VEYA kulüp yöneticisi (yeni)
drop policy if exists p_davet_ins on public.davetler;
create policy p_davet_ins on public.davetler for insert to authenticated
  with check (
    (lig_id is not null and public.lig_yoneticim(lig_id))
    or (kulup_id is not null and public.kulup_yoneticim(kulup_id))
  );
drop policy if exists p_davet_upd on public.davetler;
create policy p_davet_upd on public.davetler for update to authenticated
  using ((lig_id is not null and public.lig_yoneticim(lig_id)) or (kulup_id is not null and public.kulup_yoneticim(kulup_id)))
  with check ((lig_id is not null and public.lig_yoneticim(lig_id)) or (kulup_id is not null and public.kulup_yoneticim(kulup_id)));

-- 2) KULÜP DAVETİ KULLAN — oyuncu profiliyle kalıcı kadroya kayıt (lig yok)
--    Kadroya eklenince Faz 2 tetikleyicisi onu kulübün aktif liglerine de yayar.
create or replace function public.kulup_daveti_kullan(
  p_token text, p_ad text, p_no int, p_poz text, p_foto text,
  p_dogum date, p_boy int, p_kilo int, p_uyruk text, p_ayak text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_kulup uuid; v_pid uuid;
begin
  select kulup_id into v_kulup from public.davetler where token=p_token and tip='kulup' and aktif;
  if v_kulup is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
    values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
    returning player_id into v_pid;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
    values (v_kulup, v_pid, p_no, p_poz, true)
    on conflict (kulup_id, player_id) do nothing;
  return v_pid;
end $$;
grant execute on function public.kulup_daveti_kullan(text,text,int,text,text,date,int,int,text,text) to authenticated;

-- 3) TAKIMDAN SERBEST BIRAK — kadrodan çıkar, aktif liglerden düşür, bildir,
--    istatistik KORUNUR (mac_olaylari'na dokunulmaz). Q17/Q18.
create or replace function public.kulup_oyuncu_serbest(p_kulup uuid, p_player uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_sahip uuid; v_ad text; r record;
begin
  if not public.kulup_yoneticim(p_kulup) then return false; end if;
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

-- =====================================================================
--  Not: Süper Admin'in her oyuncu/profil/takım düzenlemesi RLS'te zaten
--  açık (p_oyuncu_upd, p_profil_upd, p_kulup_upd → admin_mi dahil).
-- =====================================================================
