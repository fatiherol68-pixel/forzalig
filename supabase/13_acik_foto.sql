-- =====================================================================
--  ForzaLig — oyuncular_acik (KVKK public view) + FOTO
--  Davetli lig sahibi değilse oyuncular bu view'den okunur. Foto eklenmezse
--  başkalarının/ziyaretçinin gözünde oyuncu fotoğrafı görünmez.
--  Foto zaten oyuncunun kendi yüklediği görsel → paylaşımda gösterilmesi normal
--  (tc/dogum/telefon GİZLİ kalır). ÖNCE 11_foto_storage.sql çalışmış olmalı.
--  Nasıl: Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

drop view if exists public.oyuncular_acik;
create view public.oyuncular_acik as
  select
    player_id,
    coalesce(nullif(takma_ad,''), ad_soyad) as gorunen_ad,
    forma_no, poz, ovr, ayak, boy, bolge, renk, deger, saglik, nitelik,
    foto,
    case when dogum is not null then extract(year from age(dogum))::int end as yas,
    durum
  from public.oyuncular;

grant select on public.oyuncular_acik to anon, authenticated;

-- KONTROL — view'de foto sütunu var mı (1 dönmeli)
select count(*) as foto_var
from information_schema.columns
where table_name='oyuncular_acik' and column_name='foto';
