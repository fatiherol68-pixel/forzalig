-- =====================================================================
--  ForzaLig — 78: SOHBET MODERASYONU (rol-kapsamlı) — Faz 4+5
--
--  Yetki: süper admin her yerde; takım yöneticisi YALNIZ kendi takım
--  sohbetinde; lig yöneticisi YALNIZ kendi lig sohbetinde. Ceza sohbete
--  özeldir (hesap kapanmaz). Susturma/engel/yavaş-mod/sadece-yönetici
--  sunucu tarafında p_sohbet_ins ile zorlanır → API/WebSocket'ten aşılamaz.
--
--  RİSK: p_sohbet_ins (mevcut mesaj-gönderme RLS'i) GÜNCELLENİR.
--  Geri alma: 73_sohbet_medya_orphan.sql'deki p_sohbet_ins'i tekrar çalıştır.
--  İdempotent. 77'den sonra.
-- =====================================================================

-- Mesaj gizleme (küfür filtresi / yönetici) alanları
alter table public.sohbet_mesajlari add column if not exists gizli boolean not null default false;
alter table public.sohbet_mesajlari add column if not exists gizli_sebep text;

-- 1) TABLOLAR ----------------------------------------------------------
create table if not exists public.sohbet_cezalari(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tur text not null,                 -- mute | ban
  kapsam text not null,              -- takim | lig | kulup | global
  kapsam_id uuid,
  biter timestamptz,                 -- null = süresiz / kalıcı
  sebep text,
  aciklama text,                     -- kullanıcıya gösterilir
  ic_not text,                       -- yalnız yönetici
  ilgili_mesaj_id uuid,
  veren_id uuid,
  veren_rol text,                    -- super_admin | takim_yon | lig_yon
  durum text not null default 'aktif',  -- aktif | kaldirildi | doldu
  kaldiran_id uuid, kaldirma_tarih timestamptz, kaldirma_not text,
  created timestamptz not null default now()
);
create index if not exists ix_sohbet_ceza_user on public.sohbet_cezalari(user_id, durum);
create index if not exists ix_sohbet_ceza_kaps on public.sohbet_cezalari(kapsam, kapsam_id, durum);

create table if not exists public.sohbet_ihlal(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tur text not null,                 -- uyari | silme | gizle
  mesaj_metni text,
  kapsam text, kapsam_id uuid,
  sebep text, veren_id uuid,
  created timestamptz not null default now()
);
create index if not exists ix_sohbet_ihlal_user on public.sohbet_ihlal(user_id, created);

create table if not exists public.sohbet_ayar(
  kapsam text not null,              -- takim | lig | kulup
  kapsam_id uuid not null,
  yavas_sn int not null default 0,   -- yavaş mod (sn) — 0 kapalı
  sadece_yonetici boolean not null default false,
  guncelleyen uuid,
  primary key(kapsam, kapsam_id)
);

-- 2) YETKİ + YAZABİLİRLİK ---------------------------------------------
-- Bu kapsamda moderasyon yetkisi var mı? (süper admin / takım yön / lig yön)
create or replace function public.moderator_yetki(p_lig uuid, p_takim uuid, p_kulup uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.admin_mi()
    or (p_takim is not null and exists(select 1 from public.takimlar t where t.id=p_takim and t.yonetici_id=auth.uid()))
    or (p_takim is null and p_lig is not null and exists(select 1 from public.ligler l where l.id=p_lig and l.yonetici_id=auth.uid()))
    or (p_kulup is not null and exists(select 1 from public.kulupler k where k.id=p_kulup and k.sahip_user_id=auth.uid()));
$$;
grant execute on function public.moderator_yetki(uuid,uuid,uuid) to authenticated;

-- Bu kullanıcı bu kanala mesaj yazabilir mi? (ceza / yavaş mod / sadece-yönetici)
create or replace function public.sohbet_yazabilir(p_lig uuid, p_takim uuid, p_kulup uuid)
returns boolean language plpgsql stable security definer set search_path=public as $$
declare v_mod boolean; v_yavas int; v_sadece boolean; v_son timestamptz;
begin
  v_mod := public.moderator_yetki(p_lig,p_takim,p_kulup);
  -- Aktif susturma/engel bu kapsamı örtüyor mu?
  if exists(select 1 from public.sohbet_cezalari c
      where c.user_id=auth.uid() and c.durum='aktif' and c.tur in ('mute','ban')
        and (c.biter is null or c.biter>now())
        and ( c.kapsam='global'
           or (c.kapsam='takim' and c.kapsam_id=p_takim)
           or (c.kapsam='lig' and c.kapsam_id=p_lig and p_takim is null)
           or (c.kapsam='kulup' and c.kapsam_id=p_kulup) )) then
    return false;
  end if;
  if not v_mod then
    select yavas_sn, sadece_yonetici into v_yavas, v_sadece from public.sohbet_ayar
      where (kapsam='takim' and kapsam_id=p_takim)
         or (kapsam='lig' and kapsam_id=p_lig and p_takim is null)
         or (kapsam='kulup' and kapsam_id=p_kulup) limit 1;
    if coalesce(v_sadece,false) then return false; end if;
    if coalesce(v_yavas,0)>0 then
      select max(olusma) into v_son from public.sohbet_mesajlari
        where user_id=auth.uid() and coalesce(silindi,false)=false
          and ( (p_takim is not null and takim_id=p_takim)
             or (p_takim is null and p_lig is not null and lig_id=p_lig and takim_id is null)
             or (p_kulup is not null and kulup_id=p_kulup) );
      if v_son is not null and (now()-v_son) < make_interval(secs => v_yavas) then return false; end if;
    end if;
  end if;
  return true;
end $$;
grant execute on function public.sohbet_yazabilir(uuid,uuid,uuid) to authenticated;

-- 3) p_sohbet_ins GÜNCELLEME (73'teki mantık + yazabilirlik kontrolü) ---
drop policy if exists p_sohbet_ins on public.sohbet_mesajlari;
create policy p_sohbet_ins on public.sohbet_mesajlari for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      case
        when kulup_id is not null then public.kulup_sohbet_erisim(kulup_id)
        when takim_id is not null then public.takim_sohbet_erisim(takim_id)
        else public.lig_uyesi(lig_id)
      end
    )
    and (medya_url is null or public.admin_mi())
    and public.sohbet_yazabilir(lig_id, takim_id, kulup_id)   -- ⬅️ susturma/yavaş/sadece-yönetici
  );

-- 4) RLS (okuma) -------------------------------------------------------
alter table public.sohbet_cezalari enable row level security;
alter table public.sohbet_ihlal    enable row level security;
alter table public.sohbet_ayar     enable row level security;

drop policy if exists p_ceza_sel on public.sohbet_cezalari;
create policy p_ceza_sel on public.sohbet_cezalari for select to authenticated
  using ( user_id=auth.uid() or public.moderator_yetki(
            case when kapsam='lig' then kapsam_id end,
            case when kapsam='takim' then kapsam_id end,
            case when kapsam='kulup' then kapsam_id end) );

drop policy if exists p_ihlal_sel on public.sohbet_ihlal;
create policy p_ihlal_sel on public.sohbet_ihlal for select to authenticated
  using ( user_id=auth.uid() or public.moderator_yetki(
            case when kapsam='lig' then kapsam_id end,
            case when kapsam='takim' then kapsam_id end,
            case when kapsam='kulup' then kapsam_id end) );

drop policy if exists p_ayar_sel on public.sohbet_ayar;
create policy p_ayar_sel on public.sohbet_ayar for select to authenticated using ( true );

grant select on public.sohbet_cezalari, public.sohbet_ihlal, public.sohbet_ayar to authenticated;

-- 5) RPC'ler (SECURITY DEFINER) ---------------------------------------
-- Ceza / uyarı ver
create or replace function public.ceza_ver(
  p_user uuid, p_tur text, p_lig uuid, p_takim uuid, p_kulup uuid,
  p_biter timestamptz, p_sebep text, p_aciklama text, p_ic_not text, p_mesaj_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_kapsam text; v_kid uuid; v_rol text;
begin
  if not public.moderator_yetki(p_lig,p_takim,p_kulup) then raise exception 'Bu sohbette moderasyon yetkiniz yok'; end if;
  v_kapsam := case when p_kulup is not null then 'kulup' when p_takim is not null then 'takim' when p_lig is not null then 'lig' else 'global' end;
  v_kid := coalesce(p_kulup,p_takim,p_lig);
  v_rol := case when public.admin_mi() then 'super_admin' when p_takim is not null then 'takim_yon' else 'lig_yon' end;
  if p_tur='uyari' then
    insert into public.sohbet_ihlal(user_id,tur,mesaj_metni,kapsam,kapsam_id,sebep,veren_id)
      values(p_user,'uyari',null,v_kapsam,v_kid,p_sebep,auth.uid());
    perform public.bildirim_yolla(p_user,'moderasyon','ForzaLig Yönetimi — Uyarı',
      coalesce(p_sebep,'Kurallara uyunuz')||coalesce(' · '||p_aciklama,''),'sohbet',v_kid::text);
    return null;
  else
    insert into public.sohbet_cezalari(user_id,tur,kapsam,kapsam_id,biter,sebep,aciklama,ic_not,ilgili_mesaj_id,veren_id,veren_rol,durum)
      values(p_user,p_tur,v_kapsam,v_kid,p_biter,p_sebep,p_aciklama,p_ic_not,p_mesaj_id,auth.uid(),v_rol,'aktif')
      returning id into v_id;
    perform public.bildirim_yolla(p_user,'moderasyon',
      'ForzaLig Yönetimi — '||case when p_tur='ban' then 'Sohbet engeli' else 'Susturma' end,
      coalesce(p_aciklama,coalesce(p_sebep,'Sohbet kısıtlaması')),'sohbet',v_kid::text);
    return v_id;
  end if;
end $$;
grant execute on function public.ceza_ver(uuid,text,uuid,uuid,uuid,timestamptz,text,text,text,uuid) to authenticated;

-- Ceza kaldır (kayıt silinmez — 'kaldirildi')
create or replace function public.ceza_kaldir(p_id uuid, p_aciklama text)
returns void language plpgsql security definer set search_path=public as $$
declare c public.sohbet_cezalari;
begin
  select * into c from public.sohbet_cezalari where id=p_id;
  if c.id is null then raise exception 'Ceza bulunamadı'; end if;
  if not public.moderator_yetki(
       case when c.kapsam='lig' then c.kapsam_id end,
       case when c.kapsam='takim' then c.kapsam_id end,
       case when c.kapsam='kulup' then c.kapsam_id end) then raise exception 'yetkisiz'; end if;
  update public.sohbet_cezalari set durum='kaldirildi', kaldiran_id=auth.uid(), kaldirma_tarih=now(), kaldirma_not=p_aciklama where id=p_id;
  perform public.bildirim_yolla(c.user_id,'moderasyon','ForzaLig Yönetimi — Kısıtlama kaldırıldı',
    coalesce(p_aciklama,'Sohbet mesajı gönderme kısıtlamanız kaldırıldı.'),'sohbet',c.kapsam_id::text);
end $$;
grant execute on function public.ceza_kaldir(uuid,text) to authenticated;

-- Sohbet ayarı (yavaş mod / sadece yönetici)
create or replace function public.sohbet_ayar_guncelle(p_lig uuid, p_takim uuid, p_kulup uuid, p_yavas int, p_sadece boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_kapsam text; v_kid uuid;
begin
  if not public.moderator_yetki(p_lig,p_takim,p_kulup) then raise exception 'yetkisiz'; end if;
  v_kapsam := case when p_kulup is not null then 'kulup' when p_takim is not null then 'takim' when p_lig is not null then 'lig' else null end;
  v_kid := coalesce(p_kulup,p_takim,p_lig);
  if v_kapsam is null then raise exception 'kapsam yok'; end if;
  insert into public.sohbet_ayar(kapsam,kapsam_id,yavas_sn,sadece_yonetici,guncelleyen)
    values(v_kapsam,v_kid,greatest(0,coalesce(p_yavas,0)),coalesce(p_sadece,false),auth.uid())
    on conflict (kapsam,kapsam_id) do update set yavas_sn=excluded.yavas_sn, sadece_yonetici=excluded.sadece_yonetici, guncelleyen=auth.uid();
end $$;
grant execute on function public.sohbet_ayar_guncelle(uuid,uuid,uuid,int,boolean) to authenticated;

-- Mesaj moderasyonu: sil / gizle / göster (rol-kapsamlı)
create or replace function public.mesaj_moderasyon(p_mesaj_id uuid, p_islem text, p_sebep text)
returns void language plpgsql security definer set search_path=public as $$
declare m public.sohbet_mesajlari;
begin
  select * into m from public.sohbet_mesajlari where id=p_mesaj_id;
  if m.id is null then raise exception 'Mesaj bulunamadı'; end if;
  if not public.moderator_yetki(m.lig_id,m.takim_id,m.kulup_id) then raise exception 'yetkisiz'; end if;
  if p_islem='sil' then
    insert into public.sohbet_ihlal(user_id,tur,mesaj_metni,kapsam,kapsam_id,sebep,veren_id)
      values(m.user_id,'silme',m.metin, case when m.takim_id is not null then 'takim' when m.lig_id is not null then 'lig' else 'kulup' end, coalesce(m.takim_id,m.lig_id,m.kulup_id), p_sebep, auth.uid());
    update public.sohbet_mesajlari set silindi=true where id=p_mesaj_id;
  elsif p_islem='gizle' then
    update public.sohbet_mesajlari set gizli=true, gizli_sebep=coalesce(p_sebep,'yonetim') where id=p_mesaj_id;
  elsif p_islem='goster' then
    update public.sohbet_mesajlari set gizli=false where id=p_mesaj_id;
  end if;
end $$;
grant execute on function public.mesaj_moderasyon(uuid,text,text) to authenticated;

-- Bu kullanıcının bu kanaldaki aktif cezası (composer için)
create or replace function public.ceza_aktif(p_lig uuid, p_takim uuid, p_kulup uuid)
returns table(tur text, biter timestamptz, sebep text, aciklama text)
language sql stable security definer set search_path=public as $$
  select c.tur, c.biter, c.sebep, c.aciklama
  from public.sohbet_cezalari c
  where c.user_id=auth.uid() and c.durum='aktif' and c.tur in ('mute','ban')
    and (c.biter is null or c.biter>now())
    and ( c.kapsam='global'
       or (c.kapsam='takim' and c.kapsam_id=p_takim)
       or (c.kapsam='lig' and c.kapsam_id=p_lig and p_takim is null)
       or (c.kapsam='kulup' and c.kapsam_id=p_kulup) )
  order by c.biter desc nulls first limit 1;
$$;
grant execute on function public.ceza_aktif(uuid,uuid,uuid) to authenticated;

-- Moderasyon geçmişi (süper admin: hepsi; yönetici: kendi kapsamı)
create or replace function public.moderasyon_gecmis(p_user uuid, p_tur text, p_durum text)
returns setof public.sohbet_cezalari
language sql stable security definer set search_path=public as $$
  select * from public.sohbet_cezalari c
  where (public.admin_mi()
      or (c.kapsam='takim' and exists(select 1 from public.takimlar t where t.id=c.kapsam_id and t.yonetici_id=auth.uid()))
      or (c.kapsam='lig' and exists(select 1 from public.ligler l where l.id=c.kapsam_id and l.yonetici_id=auth.uid())))
    and (p_user is null or c.user_id=p_user)
    and (p_tur  is null or c.tur=p_tur)
    and (p_durum is null or c.durum=p_durum)
  order by c.created desc limit 300;
$$;
grant execute on function public.moderasyon_gecmis(uuid,text,text) to authenticated;

-- Kademeli öneri: son N gündeki ihlal sayısı
create or replace function public.ihlal_ozet(p_user uuid, p_gun int)
returns int language sql stable security definer set search_path=public as $$
  select count(*)::int from (
    select created from public.sohbet_ihlal where user_id=p_user and created > now()-make_interval(days=>coalesce(p_gun,30))
    union all
    select created from public.sohbet_cezalari where user_id=p_user and created > now()-make_interval(days=>coalesce(p_gun,30))
  ) q;
$$;
grant execute on function public.ihlal_ozet(uuid,int) to authenticated;

-- KONTROL
select 'moderasyon_kur' as ne,
  (select count(*)::text from information_schema.tables where table_schema='public' and table_name in ('sohbet_cezalari','sohbet_ihlal','sohbet_ayar'))
  ||' tablo · '|| (select count(*)::text from pg_proc where proname in
    ('moderator_yetki','sohbet_yazabilir','ceza_ver','ceza_kaldir','sohbet_ayar_guncelle','mesaj_moderasyon','ceza_aktif','moderasyon_gecmis','ihlal_ozet'))
  ||' fn' as sonuc;
