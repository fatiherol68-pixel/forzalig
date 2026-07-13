-- =====================================================================
--  ForzaLig — FOTOĞRAF/LOGO ALTYAPISI
--  Oyuncu fotoğrafı + takım logosu için resim deposu (Storage) + sütunlar.
--  Nasıl: Supabase → SQL Editor → hepsini yapıştır → Run.
--  Güvenli: tekrar çalıştırılabilir (if not exists / on conflict).
-- =====================================================================

-- 1) Resim deposu (herkese açık okuma — fotoğraflar public görünür)
insert into storage.buckets (id, name, public)
values ('fotolar', 'fotolar', true)
on conflict (id) do update set public = true;

-- 2) Depo izinleri (RLS politikaları)
--    Okuma: herkes (giriş gerekmez → fotoğraflar sitede görünsün)
drop policy if exists "fotolar_oku" on storage.objects;
create policy "fotolar_oku" on storage.objects
  for select using ( bucket_id = 'fotolar' );

--    Yükleme: sadece giriş yapmış (Google ile) kullanıcılar
drop policy if exists "fotolar_yukle" on storage.objects;
create policy "fotolar_yukle" on storage.objects
  for insert to authenticated with check ( bucket_id = 'fotolar' );

--    Güncelleme/silme: giriş yapmış kullanıcılar
drop policy if exists "fotolar_guncelle" on storage.objects;
create policy "fotolar_guncelle" on storage.objects
  for update to authenticated using ( bucket_id = 'fotolar' );

drop policy if exists "fotolar_sil" on storage.objects;
create policy "fotolar_sil" on storage.objects
  for delete to authenticated using ( bucket_id = 'fotolar' );

-- 3) Veri sütunları — oyuncu fotoğrafı + takım logosu/2. renk
alter table public.oyuncular add column if not exists foto  text;
alter table public.takimlar  add column if not exists logo  text;
alter table public.takimlar  add column if not exists renk2 text;

-- 4) KONTROL — bucket ve sütunlar oluştu mu?
select 'bucket' as ne, count(*)::text as sonuc from storage.buckets where id='fotolar'
union all select 'oyuncular.foto', (select count(*)::text from information_schema.columns where table_name='oyuncular' and column_name='foto')
union all select 'takimlar.logo',  (select count(*)::text from information_schema.columns where table_name='takimlar'  and column_name='logo')
union all select 'takimlar.renk2', (select count(*)::text from information_schema.columns where table_name='takimlar'  and column_name='renk2');
