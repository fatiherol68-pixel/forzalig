-- =====================================================================
--  ForzaLig — PERFORMANS: lig ÖZET listesi (tek sorgu, sayılarla)
--  ---------------------------------------------------------------------
--  SORUN: Açılışta her lig için ayrı ayrı tam veri yükleniyordu (N+1):
--  30 lig ≈ 180 sorgu ≈ 10+ sn; 1500 ligde çöker.
--  ÇÖZÜM: Bu RPC TÜM ligleri TEK sorguda hafif özet olarak döner
--  (ad, şehir, logo + takım/maç/oyuncu SAYILARI). Tam veri (takım/oyuncu/
--  maç) yalnız bir lig AÇILINCA yüklenir. Açılış hızı lig sayısıyla
--  BÜYÜMEZ → 30 da 1500 de aynı. İdempotent. SQL Editor → Run.
--
--  Not: RPC yoksa uygulama otomatik hafif tek-sorgu fallback'ine düşer
--  (sayısız ama yine hızlı). Bu RPC'yi çalıştırınca sayılar da gelir.
-- =====================================================================

create or replace function public.ligler_ozet(p_user uuid)
returns table(
  id uuid, ad text, yonetici_id uuid, evren text, durum text,
  sehir text, ilce text, logo text, renk text, renk2 text,
  format text, grup_sayi int, kisi int, sponsor_ad text, sponsor_emoji text, kurallar text,
  takim_say bigint, mac_say bigint, oyuncu_say bigint, sahiplik text
) language sql stable security definer set search_path = public as $$
  with kapsam as (
    select l.* from public.ligler l
    where coalesce(l.silindi, false) = false
      and (
        l.evren is not null                                     -- yayınlanan evren (herkese)
        or (l.durum = 'aktif' and l.evren is null)              -- açık gerçek ligler (herkese)
        or (p_user is not null and l.yonetici_id = p_user)      -- sahibi olduğun ligler
        or (p_user is not null and exists (                     -- kaptan olduğun ligler
              select 1 from public.takimlar t where t.lig_id = l.id and t.yonetici_id = p_user))
        or (p_user is not null and exists (                     -- oyuncu olduğun ligler
              select 1 from public.oyuncu_takim ot
                join public.oyuncular o on o.player_id = ot.player_id
               where ot.lig_id = l.id and o.sahip_user_id = p_user))
      )
    order by l.olusturma desc nulls last
    limit 2000
  )
  select
    k.id, k.ad::text, k.yonetici_id, k.evren::text, k.durum::text,
    k.sehir::text, k.ilce::text, k.logo::text, k.renk::text, null::text,   -- ligler'de renk2 yok
    k.format::text, k.grup_sayi::int, k.kisi::int, k.sponsor_ad::text, k.sponsor_emoji::text, k.kurallar::text,
    (select count(*) from public.takimlar t where t.lig_id = k.id and t.durum is distinct from 'arsiv')::bigint,
    (select count(*) from public.maclar m where m.lig_id = k.id)::bigint,
    (select count(*) from public.oyuncu_takim ot where ot.lig_id = k.id and ot.aktif)::bigint,
    (case when p_user is not null and k.yonetici_id = p_user then 'benim' else 'acik' end)::text
  from kapsam k;
$$;

grant execute on function public.ligler_ozet(uuid) to authenticated, anon;
