-- =====================================================================
--  ForzaLig — AÇIK GÖRÜNÜM genişletme (ziyaretçi oyuncu niteliklerini görsün)
--  Hız/şut/pas gibi oyun nitelikleri hassas değil → ziyaretçiye açılır.
--  Doğum/telefon/kilo/TC hâlâ GİZLİ. 01-08'den SONRA çalıştır.
-- =====================================================================
drop view if exists public.oyuncular_acik;
create view public.oyuncular_acik as
  select
    player_id,
    coalesce(nullif(takma_ad,''), ad_soyad) as gorunen_ad,
    forma_no, poz, ovr, ayak, boy, bolge, renk, deger, saglik, nitelik,
    case when dogum is not null then extract(year from age(dogum))::int end as yas,
    durum
  from public.oyuncular;
grant select on public.oyuncular_acik to anon, authenticated;
