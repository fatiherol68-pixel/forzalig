-- =====================================================================
--  ForzaLig — AŞAMA 4-6: KULÜP BACKFILL + OTOMATİK KADRO
--  4) Mevcut her takım → kendi kulübüne dönüşür (kulup_id + ana kadro).
--  6) kulup_lige_katil(): kulübü bir lige ekler, ana kadroyu OTOMATİK kopyalar.
--  + kulup_oyuncu_ekle(): "isim yaz-ekle" için tek oyuncu kartı üretir.
--  48_kulup_altyapi.sql'den SONRA. İdempotent. Supabase → Run.
-- =====================================================================

-- 4) BACKFILL — kulup_id'si olmayan her takım için kulüp üret + ana kadroyu doldur
do $$
declare r record; v_kulup uuid;
begin
  for r in select t.id, t.ad, t.logo, t.renk, t.renk2, t.td, t.yonetici_id, l.evren as lig_evren
             from public.takimlar t join public.ligler l on l.id = t.lig_id
            where t.kulup_id is null loop
    insert into public.kulupler(ad, logo, renk, renk2, td, sahip_user_id, evren)
      values (r.ad, r.logo, r.renk, r.renk2, r.td, r.yonetici_id, r.lig_evren)
      returning id into v_kulup;
    update public.takimlar set kulup_id = v_kulup where id = r.id;
    insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
      select v_kulup, ot.player_id, o.forma_no, o.poz, true
        from public.oyuncu_takim ot join public.oyuncular o on o.player_id = ot.player_id
       where ot.takim_id = r.id and ot.aktif
      on conflict (kulup_id, player_id) do nothing;
  end loop;
end $$;

-- 6) OTOMATİK KADRO — kulübü bir lige ekle, ana kadroyu oyuncu_takim'a kopyala
create or replace function public.kulup_lige_katil(p_kulup uuid, p_lig uuid, p_ad text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_takim uuid; v_ad text; r record;
begin
  -- Lige takım ekleme yetkisi lig yöneticisine aittir (başkasının ligine takım sokulamaz).
  if not public.lig_yoneticim(p_lig) then raise exception 'yetkisiz'; end if;
  select ad into v_ad from public.kulupler where id = p_kulup;
  if v_ad is null then raise exception 'kulüp bulunamadı'; end if;
  -- aynı kulüp bu ligde zaten var mı? (idempotent)
  select id into v_takim from public.takimlar where lig_id = p_lig and kulup_id = p_kulup limit 1;
  if v_takim is null then
    insert into public.takimlar(lig_id, ad, kulup_id, logo, renk, renk2, td, yonetici_id)
      select p_lig, coalesce(nullif(trim(p_ad),''), v_ad), p_kulup, logo, renk, renk2, td, sahip_user_id
        from public.kulupler where id = p_kulup
      returning id into v_takim;
  end if;
  -- ana kadroyu kopyala — aynı ligde zaten aktif olan oyuncuyu atla (tekil-aktif index'e saygı)
  for r in select ko.player_id from public.kulup_oyuncu ko where ko.kulup_id = p_kulup and ko.aktif loop
    if not exists(select 1 from public.oyuncu_takim ot
                   where ot.player_id = r.player_id and ot.lig_id = p_lig and ot.aktif) then
      insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay)
        values (r.player_id, v_takim, p_lig, true, 'onayli');
    end if;
  end loop;
  return v_takim;
end $$;
grant execute on function public.kulup_lige_katil(uuid, uuid, text) to authenticated;

-- "İSİM YAZ-EKLE" — kulübe tek oyuncu (kart üret + ana kadroya ekle)
create or replace function public.kulup_oyuncu_ekle(p_kulup uuid, p_ad text, p_mevki text default null, p_forma int default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_pid uuid;
begin
  if not public.kulup_yoneticim(p_kulup) then raise exception 'yetkisiz'; end if;
  if p_ad is null or length(trim(p_ad)) = 0 then raise exception 'ad gerekli'; end if;
  insert into public.oyuncular(ad_soyad, poz, forma_no) values (trim(p_ad), p_mevki, p_forma)
    returning player_id into v_pid;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
    values (p_kulup, v_pid, p_forma, p_mevki, true)
    on conflict (kulup_id, player_id) do nothing;
  return v_pid;
end $$;
grant execute on function public.kulup_oyuncu_ekle(uuid, text, text, int) to authenticated;

-- KULÜBÜ SİL (kalıcı) — sadece sahip/admin; cascade ana kadroyu da siler
create or replace function public.kulup_kalici_sil(p_kulup uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.admin_mi() or public.kulup_yoneticim(p_kulup)) then raise exception 'yetkisiz'; end if;
  update public.takimlar set kulup_id = null where kulup_id = p_kulup; -- ligdeki takımlar kalsın, bağ kopsun
  delete from public.kulupler where id = p_kulup;
end $$;
grant execute on function public.kulup_kalici_sil(uuid) to authenticated;
-- =====================================================================
