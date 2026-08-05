-- =====================================================================
--  ForzaLig — 77: AKILLI ETİKET (@-mention) — Faz 3
--
--  Kapsam-bilinçli etiketleme: takım sohbetinde yalnız o takımın AKTİF
--  üyeleri; lig sohbetinde ligin takımları + aktif oyuncuları + kaptan/
--  yönetici + hakemler. Etiket bildirimi sunucu tarafında (trigger) kapsam
--  doğrulamasıyla gönderilir → dışarıdan/başka ligden kimse etiketlenemez.
--
--  ADDITIVE: mevcut RLS insert kapısı DEĞİŞMEZ. İdempotent. 76'dan sonra.
-- =====================================================================

-- Etiketlenen kullanıcı id'leri (mesaj başına)
alter table public.sohbet_mesajlari add column if not exists etiketler uuid[];

-- Bu kanalda etiketlenebilir/görünür ÜYELER (kapsam-filtreli). Yalnız erişimi
-- olan çağırabilir; aksi halde boş döner.
create or replace function public.sohbet_uyeleri(p_lig uuid, p_takim uuid, p_kulup uuid)
returns table(user_id uuid, ad text, foto text, takim_ad text, rol text)
language plpgsql stable security definer set search_path=public as $$
begin
  if not (public.admin_mi()
       or (p_takim is not null and public.takim_sohbet_erisim(p_takim))
       or (p_takim is null and p_lig is not null and public.lig_uyesi(p_lig))
       or (p_kulup is not null and public.kulup_sohbet_erisim(p_kulup))) then
    return;
  end if;
  return query
  with uyeler as (
    -- Aktif oyuncular (takım kanalı: o takım / lig kanalı: ligin tüm takımları)
    select o.sahip_user_id uid, coalesce(nullif(o.takma_ad,''),o.ad_soyad) ad, o.foto foto, t.ad takim_ad, 'oyuncu'::text rol
      from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id=ot.player_id
      join public.takimlar  t on t.id=ot.takim_id
      where ot.aktif and o.sahip_user_id is not null and coalesce(o.durum,'aktif')='aktif'
        and ( (p_takim is not null and ot.takim_id=p_takim)
           or (p_takim is null and p_lig is not null and ot.lig_id=p_lig) )
    union
    -- Takım kaptanı / yöneticisi
    select t.yonetici_id, coalesce(nullif(pr.ad,''),'Yönetici'), pr.foto, t.ad, 'kaptan'
      from public.takimlar t left join public.profiller pr on pr.user_id=t.yonetici_id
      where t.yonetici_id is not null
        and ( (p_takim is not null and t.id=p_takim) or (p_takim is null and p_lig is not null and t.lig_id=p_lig) )
    union
    -- Lig yöneticisi
    select l.yonetici_id, coalesce(nullif(pr.ad,''),'Lig Yön.'), pr.foto, null, 'lig_yon'
      from public.ligler l left join public.profiller pr on pr.user_id=l.yonetici_id
      where l.yonetici_id is not null
        and ( l.id=p_lig or (p_takim is not null and l.id=(select lig_id from public.takimlar where id=p_takim)) )
    union
    -- Lig sohbetinde: bu lige atanmış aktif hakemler
    select pr.user_id, coalesce(nullif(pr.ad,''),'Hakem'), pr.foto, null, 'hakem'
      from public.profiller pr
      where p_takim is null and p_lig is not null
        and pr.roller @> '{"hakem":true}'::jsonb
        and coalesce((pr.roller->>'hakem_pasif')::boolean,false)=false
        and ( pr.roller->'hakem_ligler' is null
           or pr.roller->'hakem_ligler' = '[]'::jsonb
           or (pr.roller->'hakem_ligler') ? p_lig::text )
  )
  select distinct on (uid) uid, ad, foto, takim_ad, rol
  from uyeler where uid is not null order by uid, rol;
end $$;
grant execute on function public.sohbet_uyeleri(uuid,uuid,uuid) to authenticated;

-- Etiket bildirimi: mesaj eklenince, yalnız KAPSAMDAKİ ve gönderen olmayan
-- kullanıcılara tek bildirim. Bildirim hatası mesajı ASLA engellemez.
create or replace function public.trg_etiket_bildir()
returns trigger language plpgsql security definer set search_path=public as $$
declare u uuid; v_ad text; v_scope uuid[];
begin
  if new.etiketler is null or array_length(new.etiketler,1) is null then return new; end if;
  begin
    v_ad := coalesce(nullif(new.ad,''),'Biri');
    select array_agg(user_id) into v_scope from public.sohbet_uyeleri(new.lig_id, new.takim_id, new.kulup_id);
    for u in select distinct x from unnest(new.etiketler) x loop
      if u is not null and u <> new.user_id and u = any(coalesce(v_scope,'{}'::uuid[])) then
        perform public.bildirim_yolla(u, 'etiket', v_ad||' sizi etiketledi',
          left(coalesce(new.metin,''),120), 'sohbet',
          coalesce(new.takim_id::text, new.lig_id::text, new.kulup_id::text));
      end if;
    end loop;
  exception when others then null;  -- bildirim başarısız olsa da mesaj kalır
  end;
  return new;
end $$;
drop trigger if exists t_etiket_bildir on public.sohbet_mesajlari;
create trigger t_etiket_bildir after insert on public.sohbet_mesajlari
  for each row execute function public.trg_etiket_bildir();

-- KONTROL
select 'etiket_kur' as ne,
  (select count(*)::text from information_schema.columns where table_schema='public' and table_name='sohbet_mesajlari' and column_name='etiketler')
  ||' kolon · fn:'|| (select count(*)::text from pg_proc where proname='sohbet_uyeleri') as sonuc;
