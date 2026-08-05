-- =====================================================================
--  ForzaLig — 79: sohbet_uyeleri düzeltmesi (@-etiket listesi)
--
--  SORUN: liste yalnız hesaba bağlı (sahip_user_id dolu) oyuncuları
--  getiriyordu → gerçek hesaba bağlanmamış oyuncular @-panelde görünmüyordu.
--  ÇÖZÜM: takımın/ligin TÜM aktif oyuncuları isimle listelenir. Bildirim
--  yalnız hesaba bağlı (user_id dolu) olanlara gider. player_id da döner
--  (profil linki için). 77'den sonra. İdempotent.
-- =====================================================================

drop function if exists public.sohbet_uyeleri(uuid,uuid,uuid);
create or replace function public.sohbet_uyeleri(p_lig uuid, p_takim uuid, p_kulup uuid)
returns table(user_id uuid, player_id uuid, ad text, foto text, takim_ad text, rol text)
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
    -- TÜM aktif oyuncular (hesaba bağlı olsun olmasın)
    select o.sahip_user_id uid, o.player_id pid, coalesce(nullif(o.takma_ad,''),o.ad_soyad) ad, o.foto foto, t.ad takim_ad, 'oyuncu'::text rol
      from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id=ot.player_id
      join public.takimlar  t on t.id=ot.takim_id
      where ot.aktif and coalesce(o.durum,'aktif')='aktif'
        and ( (p_takim is not null and ot.takim_id=p_takim)
           or (p_takim is null and p_lig is not null and ot.lig_id=p_lig) )
    union
    select t.yonetici_id, null::uuid, coalesce(nullif(pr.ad,''),'Yönetici'), pr.foto, t.ad, 'kaptan'
      from public.takimlar t left join public.profiller pr on pr.user_id=t.yonetici_id
      where t.yonetici_id is not null
        and ( (p_takim is not null and t.id=p_takim) or (p_takim is null and p_lig is not null and t.lig_id=p_lig) )
    union
    select l.yonetici_id, null::uuid, coalesce(nullif(pr.ad,''),'Lig Yön.'), pr.foto, null, 'lig_yon'
      from public.ligler l left join public.profiller pr on pr.user_id=l.yonetici_id
      where l.yonetici_id is not null
        and ( l.id=p_lig or (p_takim is not null and l.id=(select lig_id from public.takimlar where id=p_takim)) )
    union
    select pr.user_id, null::uuid, coalesce(nullif(pr.ad,''),'Hakem'), pr.foto, null, 'hakem'
      from public.profiller pr
      where p_takim is null and p_lig is not null
        and pr.roller @> '{"hakem":true}'::jsonb
        and coalesce((pr.roller->>'hakem_pasif')::boolean,false)=false
        and ( pr.roller->'hakem_ligler' is null or pr.roller->'hakem_ligler'='[]'::jsonb or (pr.roller->'hakem_ligler') ? p_lig::text )
  )
  select distinct on (coalesce(uid,pid)) uid, pid, ad, foto, takim_ad, rol
  from uyeler where (uid is not null or pid is not null) order by coalesce(uid,pid), rol;
end $$;
grant execute on function public.sohbet_uyeleri(uuid,uuid,uuid) to authenticated;

select 'sohbet_uyeleri' as ne, (select count(*)::text from pg_proc where proname='sohbet_uyeleri') as sonuc;
