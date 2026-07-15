-- =====================================================================
--  ForzaLig — STORAGE GÜVENLİĞİ (Faz 1)
--  SORUN: Mevcut politikalar sahiplik kontrolü yapmıyordu → giriş yapan
--  HERKES, HERKESİN fotoğrafını/logosunu silip değiştirebiliyordu.
--  ÇÖZÜM: Dosyalar yükleyenin kendi klasörüne (uid/…) yazılır; kullanıcı
--  sadece KENDİ klasörüne yazabilir/silebilir. Okuma herkese açık kalır.
--  Ayrıca bucket'a sadece resim + max 2 MB kısıtı eklenir.
--
--  ÖNEMLİ SIRA: Bu SQL, siteyi bir kez yeniledikten SONRA çalıştır
--  (yeni kod dosyaları uid/… yoluna yüklüyor). Bir kez çalıştır, idempotent.
-- =====================================================================

-- 1) Bucket: sadece resim türleri + 2 MB üst sınır (yeni yüklemeler için)
update storage.buckets
set public = true,
    file_size_limit = 2097152,                                  -- 2 MB
    allowed_mime_types = array['image/webp','image/png','image/jpeg']
where id = 'fotolar';

-- 2) OKUMA: herkese açık (fotoğraflar sitede görünsün, giriş gerekmez)
drop policy if exists "fotolar_oku" on storage.objects;
create policy "fotolar_oku" on storage.objects
  for select using ( bucket_id = 'fotolar' );

-- 3) YÜKLEME: sadece giriş yapmış kullanıcı ve SADECE kendi klasörüne
--    Yol biçimi: {auth.uid()}/{oyuncu|logo}/{uuid}.webp
--    storage.foldername(name)[1] = klasör yolunun ilk parçası = uid
drop policy if exists "fotolar_yukle" on storage.objects;
create policy "fotolar_yukle" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'fotolar'
    and (storage.foldername(name))[1] = auth.uid()::text );

-- 4) GÜNCELLEME: sadece kendi klasöründeki dosya
drop policy if exists "fotolar_guncelle" on storage.objects;
create policy "fotolar_guncelle" on storage.objects
  for update to authenticated
  using ( bucket_id = 'fotolar'
    and (storage.foldername(name))[1] = auth.uid()::text );

-- 5) SİLME: sadece kendi klasöründeki dosya (eski fotoğrafını değiştirince siler)
--    Süper admin de temizlik için silebilsin (orphan/bakım).
drop policy if exists "fotolar_sil" on storage.objects;
create policy "fotolar_sil" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'fotolar'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.admin_mi() ) );

-- 6) KONTROL
select 'bucket_limit' as ne,
       (select file_size_limit::text from storage.buckets where id='fotolar') as sonuc
union all
select 'izinli_tur',
       (select array_to_string(allowed_mime_types,',') from storage.buckets where id='fotolar')
union all
select 'politika_sayisi',
       (select count(*)::text from pg_policies where tablename='objects' and policyname like 'fotolar_%');
