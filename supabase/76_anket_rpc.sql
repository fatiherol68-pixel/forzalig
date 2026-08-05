-- =====================================================================
--  ForzaLig — 76: ANKET RPC'LERİ (Faz 1+2) — SECURITY DEFINER
--
--  Tüm yönetim işlemleri admin_mi() kontrolüyle sunucuda. Oy/yorum
--  hedefleme + zaman + tek-oy + gizli-oy kuralları burada zorlanır →
--  istemci manipülasyonu geçmez. 75_anket.sql'den SONRA çalıştır. İdempotent.
-- =====================================================================

-- Kullanıcı bu anketin hedefinde mi? (kart gösterimi + oy/yorum izni)
create or replace function public.anket_hedefte_mi(p_anket uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.anket_hedef h where h.anket_id=p_anket and (
         h.kapsam='tum'
      or (h.kapsam in ('lig','lig_takimlari') and public.lig_uyesi(h.kapsam_id))
      or (h.kapsam='takim' and public.takim_sohbet_erisim(h.kapsam_id))
      or (h.kapsam='kullanici' and h.kapsam_id=auth.uid())
      or (h.kapsam='rol' and (
            (h.rol_filtre='kaptan'  and exists(select 1 from public.takimlar t where t.yonetici_id=auth.uid()))
         or (h.rol_filtre='lig_yon' and exists(select 1 from public.ligler   l where l.yonetici_id=auth.uid()))
         or (h.rol_filtre='aktif'   and exists(select 1 from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id where ot.aktif and o.sahip_user_id=auth.uid()))
      ))
    )
  );
$$;
grant execute on function public.anket_hedefte_mi(uuid) to authenticated;

-- Hedefteki BENZERSİZ kullanıcılar (yalnız admin) — net hedef sayımı + oy vermeyenler
create or replace function public.anket_hedef_uid(p_anket uuid)
returns setof uuid language plpgsql stable security definer set search_path=public as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
  select distinct u from (
    select p.user_id u from public.profiller p
      where exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='tum')
    union select o.sahip_user_id from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
      where ot.aktif and ot.lig_id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam in ('lig','lig_takimlari'))
    union select t.yonetici_id from public.takimlar t
      where t.lig_id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam in ('lig','lig_takimlari'))
    union select l.yonetici_id from public.ligler l
      where l.id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam in ('lig','lig_takimlari'))
    union select o.sahip_user_id from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
      where ot.aktif and ot.takim_id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam='takim')
    union select t.yonetici_id from public.takimlar t
      where t.id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam='takim')
    union select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam='kullanici'
    union select t.yonetici_id from public.takimlar t where exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='rol' and h.rol_filtre='kaptan')
    union select l.yonetici_id from public.ligler l where exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='rol' and h.rol_filtre='lig_yon')
    union select o.sahip_user_id from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
      where ot.aktif and exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='rol' and h.rol_filtre='aktif')
  ) q where u is not null;
end $$;
grant execute on function public.anket_hedef_uid(uuid) to authenticated;

create or replace function public.anket_hedef_say(p_anket uuid)
returns int language sql stable security definer set search_path=public as $$
  select count(*)::int from public.anket_hedef_uid(p_anket);
$$;
grant execute on function public.anket_hedef_say(uuid) to authenticated;

create or replace function public.anket_oy_vermeyenler(p_anket uuid)
returns setof uuid language plpgsql stable security definer set search_path=public as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
    select u from public.anket_hedef_uid(p_anket) u
    where u not in (select user_id from public.anket_katilim where anket_id=p_anket)
      and u not in (select user_id from public.anket_oy where anket_id=p_anket);
end $$;
grant execute on function public.anket_oy_vermeyenler(uuid) to authenticated;

-- Bu sohbet kanalında gösterilecek AKTİF anketler (kullanıcı hedefteyse)
create or replace function public.sohbet_anketleri(p_lig uuid, p_takim uuid, p_kulup uuid)
returns setof public.anketler language sql stable security definer set search_path=public as $$
  select a.* from public.anketler a
  where a.durum='yayin'
    and (a.baslar is null or a.baslar<=now())
    and (a.biter  is null or a.biter> now())
    and public.anket_hedefte_mi(a.id)
    and exists(select 1 from public.anket_hedef h where h.anket_id=a.id and (
          h.kapsam='tum'
       or (p_takim is not null and h.kapsam='takim' and h.kapsam_id=p_takim)
       or (p_takim is null and h.kapsam in ('lig','lig_takimlari') and h.kapsam_id=p_lig)
       or (p_takim is not null and h.kapsam in ('lig','lig_takimlari') and h.kapsam_id=(select lig_id from public.takimlar where id=p_takim))
       or (p_takim is null and h.kapsam in ('rol','kullanici'))
    ))
  order by a.created desc;
$$;
grant execute on function public.sohbet_anketleri(uuid,uuid,uuid) to authenticated;

-- Anket oluştur (admin) — seçenekler text[], hedefler jsonb [{kapsam,kapsam_id,rol_filtre}]
create or replace function public.anket_olustur(
  p_baslik text, p_aciklama text default null, p_gorsel text default null,
  p_tip text default 'tek', p_max int default 1,
  p_yorum boolean default true, p_gizli boolean default false,
  p_oy_degistir boolean default true, p_sonuc text default 'oydan_sonra',
  p_baslar timestamptz default null, p_biter timestamptz default null,
  p_durum text default 'taslak',
  p_secenekler text[] default '{}', p_hedefler jsonb default '[]'
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; s text; i int:=0; v_sid uuid; h jsonb;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  if coalesce(array_length(p_secenekler,1),0) < 2 then raise exception 'En az 2 seçenek gerekli'; end if;
  if array_length(p_secenekler,1) > 10 then raise exception 'En fazla 10 seçenek'; end if;
  insert into public.anketler(baslik,aciklama,gorsel,tip,max_secim,yorum_acik,gizli_oy,oy_degistir,sonuc_gorunur,baslar,biter,durum,olusturan)
    values(p_baslik,p_aciklama,p_gorsel,coalesce(p_tip,'tek'),greatest(1,coalesce(p_max,1)),coalesce(p_yorum,true),coalesce(p_gizli,false),coalesce(p_oy_degistir,true),coalesce(p_sonuc,'oydan_sonra'),p_baslar,p_biter,coalesce(p_durum,'taslak'),auth.uid())
    returning id into v_id;
  foreach s in array p_secenekler loop
    insert into public.anket_secenek(anket_id,metin,sira) values(v_id,s,i) returning id into v_sid;
    insert into public.anket_oy_sayac(anket_id,secenek_id,adet) values(v_id,v_sid,0) on conflict do nothing;
    i:=i+1;
  end loop;
  for h in select value from jsonb_array_elements(coalesce(p_hedefler,'[]'::jsonb)) loop
    insert into public.anket_hedef(anket_id,kapsam,kapsam_id,rol_filtre)
      values(v_id, h->>'kapsam', nullif(h->>'kapsam_id','')::uuid, nullif(h->>'rol_filtre',''));
  end loop;
  return v_id;
end $$;
grant execute on function public.anket_olustur(text,text,text,text,int,boolean,boolean,boolean,text,timestamptz,timestamptz,text,text[],jsonb) to authenticated;

create or replace function public.anket_durum(p_id uuid, p_durum text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.anketler set durum=p_durum where id=p_id;
end $$;
grant execute on function public.anket_durum(uuid,text) to authenticated;

create or replace function public.anket_guncelle(p_id uuid, p_baslik text, p_aciklama text, p_biter timestamptz, p_yorum boolean, p_sonuc text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.anketler set baslik=coalesce(p_baslik,baslik), aciklama=p_aciklama, biter=p_biter,
    yorum_acik=coalesce(p_yorum,yorum_acik), sonuc_gorunur=coalesce(p_sonuc,sonuc_gorunur) where id=p_id;
end $$;
grant execute on function public.anket_guncelle(uuid,text,text,timestamptz,boolean,text) to authenticated;

-- OY VER — tek oy, hedef+zaman+tip kontrolü; gizli oyda kullanıcı↔seçim bağı yazılmaz
create or replace function public.anket_oy_ver(p_anket uuid, p_secenekler uuid[])
returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.anketler; n int; s uuid; v_lig uuid; v_takim uuid;
begin
  select * into a from public.anketler where id=p_anket;
  if a.id is null then raise exception 'Anket bulunamadı'; end if;
  if a.durum<>'yayin' then raise exception 'Anket oya kapalı'; end if;
  if a.baslar is not null and a.baslar>now() then raise exception 'Anket henüz başlamadı'; end if;
  if a.biter  is not null and a.biter<=now() then raise exception 'Anket süresi doldu'; end if;
  if not public.anket_hedefte_mi(p_anket) then raise exception 'Bu anket size açık değil'; end if;
  n := coalesce(array_length(p_secenekler,1),0);
  if n=0 then raise exception 'Seçenek seçilmedi'; end if;
  if a.tip='tek'  and n>1 then raise exception 'Bu ankette tek seçim yapılır'; end if;
  if a.tip='coklu' and n>a.max_secim then raise exception 'En fazla '||a.max_secim||' seçim yapılabilir'; end if;
  if exists(select 1 from unnest(p_secenekler) x where x not in (select id from public.anket_secenek where anket_id=p_anket)) then
    raise exception 'Geçersiz seçenek'; end if;
  if a.gizli_oy then
    if exists(select 1 from public.anket_katilim where anket_id=p_anket and user_id=auth.uid()) then
      raise exception 'Gizli ankette oy değiştirilemez'; end if;
    insert into public.anket_katilim(anket_id,user_id) values(p_anket,auth.uid());
    foreach s in array p_secenekler loop
      update public.anket_oy_sayac set adet=adet+1 where anket_id=p_anket and secenek_id=s;
    end loop;
  else
    if not a.oy_degistir and exists(select 1 from public.anket_katilim where anket_id=p_anket and user_id=auth.uid()) then
      raise exception 'Bu ankette oy değiştirilemez'; end if;
    select ot.lig_id, ot.takim_id into v_lig, v_takim from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id=ot.player_id where o.sahip_user_id=auth.uid() and ot.aktif limit 1;
    update public.anket_oy_sayac c set adet=greatest(0,adet-1)
      where c.anket_id=p_anket and c.secenek_id in (select secenek_id from public.anket_oy where anket_id=p_anket and user_id=auth.uid());
    delete from public.anket_oy where anket_id=p_anket and user_id=auth.uid();
    insert into public.anket_katilim(anket_id,user_id) values(p_anket,auth.uid()) on conflict do nothing;
    foreach s in array p_secenekler loop
      insert into public.anket_oy(anket_id,user_id,secenek_id,lig_id,takim_id) values(p_anket,auth.uid(),s,v_lig,v_takim) on conflict do nothing;
      update public.anket_oy_sayac set adet=adet+1 where anket_id=p_anket and secenek_id=s;
    end loop;
  end if;
  return jsonb_build_object('ok',true);
end $$;
grant execute on function public.anket_oy_ver(uuid,uuid[]) to authenticated;

-- YORUM yaz / sil
create or replace function public.anket_yorum_yaz(p_anket uuid, p_metin text)
returns uuid language plpgsql security definer set search_path=public as $$
declare a public.anketler; v_ad text; v_takim text; v_lig text; v_id uuid;
begin
  select * into a from public.anketler where id=p_anket;
  if a.id is null then raise exception 'Anket bulunamadı'; end if;
  if not a.yorum_acik then raise exception 'Yorumlar kapalı'; end if;
  if a.durum<>'yayin' then raise exception 'Anket aktif değil'; end if;
  if not public.anket_hedefte_mi(p_anket) then raise exception 'Bu anket size açık değil'; end if;
  if length(coalesce(trim(p_metin),''))=0 then raise exception 'Boş yorum'; end if;
  select coalesce(o.takma_ad,o.ad_soyad), t.ad, l.ad into v_ad, v_takim, v_lig
    from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
    left join public.takimlar t on t.id=ot.takim_id left join public.ligler l on l.id=ot.lig_id
    where o.sahip_user_id=auth.uid() and ot.aktif limit 1;
  if v_ad is null then select ad into v_ad from public.profiller where user_id=auth.uid(); end if;
  insert into public.anket_yorum(anket_id,user_id,ad,takim_ad,lig_ad,metin)
    values(p_anket,auth.uid(),coalesce(v_ad,'Kullanıcı'),v_takim,v_lig,trim(p_metin)) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.anket_yorum_yaz(uuid,text) to authenticated;

create or replace function public.anket_yorum_sil(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not (public.admin_mi() or exists(select 1 from public.anket_yorum where id=p_id and user_id=auth.uid())) then
    raise exception 'yetkisiz'; end if;
  update public.anket_yorum set silindi=true where id=p_id;
end $$;
grant execute on function public.anket_yorum_sil(uuid) to authenticated;

-- SONUÇ (genel — anonim sayaçtan)
create or replace function public.anket_sonuc(p_anket uuid)
returns table(secenek_id uuid, metin text, sira int, adet int)
language sql stable security definer set search_path=public as $$
  select s.id, s.metin, s.sira, coalesce(c.adet,0)
  from public.anket_secenek s
  left join public.anket_oy_sayac c on c.anket_id=s.anket_id and c.secenek_id=s.id
  where s.anket_id=p_anket order by s.sira;
$$;
grant execute on function public.anket_sonuc(uuid) to authenticated;

-- SONUÇ kırılımı (lig/takım — yalnız AÇIK oy; admin)
create or replace function public.anket_sonuc_kirilim(p_anket uuid, p_seviye text)
returns table(grup_id uuid, adet int) language plpgsql stable security definer set search_path=public as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
    select case when p_seviye='takim' then o.takim_id else o.lig_id end, count(*)::int
    from public.anket_oy o where o.anket_id=p_anket group by 1;
end $$;
grant execute on function public.anket_sonuc_kirilim(uuid,text) to authenticated;

-- KONTROL
select 'anket_rpc' as ne, (select count(*)::text from pg_proc where proname in
  ('anket_hedefte_mi','anket_hedef_uid','anket_hedef_say','anket_oy_vermeyenler','sohbet_anketleri',
   'anket_olustur','anket_durum','anket_guncelle','anket_oy_ver','anket_yorum_yaz','anket_yorum_sil',
   'anket_sonuc','anket_sonuc_kirilim')) as sonuc;
