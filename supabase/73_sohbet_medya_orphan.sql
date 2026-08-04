-- =====================================================================
--  ForzaLig — 73: SOHBET MEDYA (yalnız Süper Admin) + GÜVENLİ ORPHAN
--
--  İKİ İŞ BİR ARADA:
--   A) Sohbet mesajlarına foto/ses eklenebilmesi (medya_url + medya_tip).
--      Medya YALNIZCA Süper Admin gönderebilir — RLS ile de zorlanır.
--      Normal kullanıcı/yönetici sadece metin gönderir (eskisi gibi).
--   B) "Sahipsiz dosya" (orphan) taraması GÜVENLİ hale getirilir.
--      ESKİ depo_orphan_bul() SADECE oyuncular.foto + takimlar.logo'ya
--      bakıyordu → profil fotoğrafı, kulüp logosu, kart fotoğrafı, sohbet
--      medyası vb. AKTİF dosyaları "sahipsiz" sanıp SİLEBİLİRDİ. Bu ciddi
--      bir veri kaybı riskidir. Yeni sürüm bucket'a URL yazan TÜM kolonları
--      tarar ve her dosyanın YAŞINI (gün) döndürür → panel yalnızca 14
--      günden eski, gerçekten sahipsiz dosyaları siler.
--
--  GÜVENLİ: Uygulama bu SQL olmadan da çalışır (medya butonları admin'e
--  görünür ama gönderim, kolon yokken hatayı yakalayıp uyarır; orphan
--  silme, yaş bilgisi gelmezse panelde OTOMATİK durur). İdempotent —
--  birden çok kez çalıştırılabilir. Supabase → SQL Editor → Run.
--  SIRA: 63/64'ten SONRA çalıştır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A) SOHBET MEDYA KOLONLARI
-- ---------------------------------------------------------------------
alter table public.sohbet_mesajlari add column if not exists medya_url text;
alter table public.sohbet_mesajlari add column if not exists medya_tip text;   -- 'foto' | 'ses'

-- A.2) YAZMA POLİTİKASI — 63'teki erişim mantığı BİREBİR korunur, üstüne
--      "medya varsa yalnız Süper Admin" şartı eklenir. Böylece normal
--      kullanıcı API'den de medya ekleyemez (buton gizli + RLS kilidi).
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
    and (medya_url is null or public.admin_mi())   -- ⬅️ medya yalnız süper admin
  );

-- A.3) BUCKET: ses türleri + 5 MB üst sınır (foto zaten resize ile küçük)
update storage.buckets
set file_size_limit = 5242880,                       -- 5 MB (ses kaydı için)
    allowed_mime_types = array[
      'image/webp','image/png','image/jpeg',
      'audio/webm','audio/mpeg','audio/mp3','audio/mp4','audio/aac',
      'audio/ogg','audio/wav','audio/x-wav','audio/x-m4a'
    ]
where id = 'fotolar';

-- ---------------------------------------------------------------------
-- B) GÜVENLİ SAHİPSİZ (ORPHAN) DOSYA TARAMASI
--    Bucket'a URL yazan TÜM kolonlar referans kabul edilir. Bir dosya
--    bu kolonların HİÇBİRİNDE geçmiyorsa "sahipsiz"dir. Yaş (gün) döner.
-- ---------------------------------------------------------------------
drop function if exists public.depo_orphan_bul();
create or replace function public.depo_orphan_bul()
returns table(yol text, boyut bigint, olusma timestamptz, yas_gun int)
language plpgsql security definer set search_path = public, storage as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
  with ref(u) as (
    -- Bucket'a public URL yazabilen HER kolon (aktif dosya sayılır):
    select foto        from public.oyuncular        where foto is not null
    union all select logo        from public.takimlar         where logo is not null
    union all select td->>'foto' from public.takimlar         where td ? 'foto'
    union all select logo        from public.ligler           where logo is not null
    union all select foto        from public.profiller        where foto is not null
    union all select logo        from public.kulupler         where logo is not null
    union all select td->>'foto' from public.kulupler         where td ? 'foto'
    union all select url         from public.oyuncu_kart_foto where url is not null
    union all select foto        from public.sohbet_mesajlari where foto is not null
    union all select takim_logo  from public.sohbet_mesajlari where takim_logo is not null
    union all select medya_url   from public.sohbet_mesajlari where medya_url is not null
    union all select takim_logo  from public.pazar_ilanlari   where takim_logo is not null
    union all select deger       from public.sistem_ayar      where deger is not null
  ),
  kullanilan(ad) as (
    -- URL içinden bucket dosya yolunu çıkar: .../fotolar/{yol}
    select distinct split_part(u, '/fotolar/', 2)
    from ref
    where u like '%/fotolar/%'
  )
  select o.name,
         coalesce((o.metadata->>'size')::bigint, 0),
         o.created_at,
         greatest(0, extract(day from (now() - o.created_at)))::int
  from storage.objects o
  where o.bucket_id = 'fotolar'
    and o.name is not null
    -- Aktif kullanılan hiçbir dosya listeye GİRMEZ (not exists = NULL-güvenli):
    and not exists (select 1 from kullanilan k where k.ad = o.name)
  order by o.created_at asc;
end $$;
grant execute on function public.depo_orphan_bul() to authenticated;
-- (Silme, panelden storage API ile ve yalnız 14 gün+ dosyalarda yapılır;
--  admin_mi() silme izni 36_storage_guvenlik.sql'de tanımlı.)

-- ---------------------------------------------------------------------
-- C) KONTROL
-- ---------------------------------------------------------------------
select 'medya_kolon'   as ne, (select count(*)::text from information_schema.columns
        where table_schema='public' and table_name='sohbet_mesajlari' and column_name in ('medya_url','medya_tip')) as sonuc
union all
select 'bucket_limit',  (select file_size_limit::text from storage.buckets where id='fotolar')
union all
select 'ses_izinli',    (select (array['audio/webm'] <@ allowed_mime_types)::text from storage.buckets where id='fotolar')
union all
select 'orphan_fn',     (select count(*)::text from pg_proc where proname='depo_orphan_bul');
