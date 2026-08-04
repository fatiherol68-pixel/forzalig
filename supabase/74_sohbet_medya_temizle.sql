-- =====================================================================
--  ForzaLig — 74: SOHBET MEDYASINI TEMİZLE (süper admin, RLS-güvenli)
--
--  SORUN: İstemciden toplu "medya sil" (update silindi/medya_url) bazı
--  hesaplarda RLS WITH CHECK'e takılıyor ("new row violates row-level
--  security policy") — çünkü medya mesajları farklı bir admin user_id ile
--  gönderilmiş veya canlı UPDATE politikası user_id=auth.uid() istiyor.
--
--  ÇÖZÜM: SECURITY DEFINER fonksiyon. İçeride admin_mi() kontrolü var;
--  yalnız süper admin çağırabilir. RLS'i güvenli şekilde bypass ederek
--  kapsamdaki (lig/takım/kulüp veya tümü) foto/ses mesajlarını gizler
--  (silindi=true) ve medya referansını kaldırır. Silinecek dosya yollarını
--  döndürür → istemci depodan siler (admin'in silme izni 36'da var).
--
--  Maç sonucu kartları ve yazılı mesajlar ETKİLENMEZ (yalnız medya_url dolu
--  satırlar). İdempotent. Supabase → SQL Editor → Run. 73'ten SONRA.
-- =====================================================================

drop function if exists public.sohbet_medya_temizle(uuid,uuid,uuid,boolean);
create or replace function public.sohbet_medya_temizle(
  p_lig   uuid    default null,
  p_takim uuid    default null,
  p_kulup uuid    default null,
  p_hepsi boolean default false
)
returns setof text
language plpgsql security definer set search_path = public, storage as $$
declare v_yollar text[];
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;

  -- Kapsam koşulu: hepsi | kulüp | lig-geneli(takim null) | takım
  -- 1) Silinecek dosya yollarını topla (referans null'lanmadan ÖNCE)
  select coalesce(array_agg(split_part(medya_url,'/fotolar/',2)),'{}'::text[])
    into v_yollar
    from public.sohbet_mesajlari
   where medya_url is not null and medya_url like '%/fotolar/%'
     and ( p_hepsi
        or (p_kulup is not null and kulup_id = p_kulup)
        or (p_kulup is null and p_lig is not null and lig_id = p_lig
             and ( (p_takim is not null and takim_id = p_takim)
                or (p_takim is null and takim_id is null) )) );

  -- 2) Mesajları gizle + medya referansını kaldır
  update public.sohbet_mesajlari
     set silindi = true, medya_url = null, medya_tip = null
   where medya_url is not null
     and ( p_hepsi
        or (p_kulup is not null and kulup_id = p_kulup)
        or (p_kulup is null and p_lig is not null and lig_id = p_lig
             and ( (p_takim is not null and takim_id = p_takim)
                or (p_takim is null and takim_id is null) )) );

  -- 3) İstemcinin depodan sileceği yolları döndür
  return query select unnest(v_yollar);
end $$;
grant execute on function public.sohbet_medya_temizle(uuid,uuid,uuid,boolean) to authenticated;

-- KONTROL
select 'fn_var' as ne, (select count(*)::text from pg_proc where proname='sohbet_medya_temizle') as sonuc;
