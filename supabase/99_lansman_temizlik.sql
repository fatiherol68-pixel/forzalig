-- =====================================================================
--  ForzaLig — LANSMAN TEMİZLİĞİ  (SADECE yayına hazır olunca çalıştır!)
--  ⚠️ GERİ ALINAMAZ. Tüm demo/test verisini + demo üyeleri siler.
--  Senin gerçek hesabın (fatiherol68@gmail.com) ve Süper Admin yetkin KALIR.
--
--  Nasıl: Supabase → SQL Editor → hepsini yapıştır → Run.
--  Silme sırası FK ilişkilerine göre ayarlandı (hatasız çalışır).
-- =====================================================================

-- 1) TRANSFERLER (ligler'e cascade DEĞİL → önce bunu sil)
delete from public.transferler;

-- 2) DAVET linkleri
delete from public.davetler;

-- 3) MAÇLAR (cascade ile gider: mac_olaylari, mac_odulleri, ilk11, katilim, mac_sonuc_log)
delete from public.maclar;

-- 4) OYUNCU-TAKIM üyelikleri
delete from public.oyuncu_takim;

-- 5) OYUNCULAR (artık kimse referans vermiyor → güvenli)
delete from public.oyuncular;

-- 6) TAKIMLAR
delete from public.takimlar;

-- 7) LİGLER
delete from public.ligler;

-- 8) TAKİPLER, LOGLAR, ANALİTİK (temiz başlangıç)
delete from public.takipler;
delete from public.islem_log;
delete from public.olay_log;

-- 9) ESKİ paylaşılan lig sistemi (varsa; tablo yoksa bu satırı atla)
delete from public.paylasilan_ligler;

-- 10) DEMO ÜYELER (@forzalig.test) — profiller/lig_haklari/takipler cascade ile gider
delete from auth.users where email like '%@forzalig.test';

-- 11) Kalan üyelerin lig hakkı sayacını sıfırla (stres testinden kalan "kullanılan" temizlensin)
update public.lig_haklari set kullanilan = 0;

-- =====================================================================
--  İSTEĞE BAĞLI — SADECE belirli hesaplar kalsın, gerisi silinsin.
--  (Kendinden başka test hesabı açtıysan ve onları da silmek istersen aç.)
--  Kardeşini eklersen e-postasını listeye ekle!
-- =====================================================================
-- delete from auth.users
--   where email not in ('fatiherol68@gmail.com');

-- =====================================================================
--  KONTROL — hepsi 0 (ve üye 1) olmalı
-- =====================================================================
select 'ligler'   as tablo, count(*) from public.ligler
union all select 'takimlar',  count(*) from public.takimlar
union all select 'oyuncular', count(*) from public.oyuncular
union all select 'maclar',    count(*) from public.maclar
union all select 'uyeler',    count(*) from auth.users
union all select 'adminler',  count(*) from public.adminler;
