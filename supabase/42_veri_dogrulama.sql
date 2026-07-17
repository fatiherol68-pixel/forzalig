-- =====================================================================
--  ForzaLig — VERİ DOĞRULAMA (CTO audit Faz 3)
--  Sunucu tarafı alan sınırları + başvuru tekilliği.
--  GÜVENLİ: CHECK'ler NOT VALID → MEVCUT veriyi kontrol etmez, bozmaz;
--  yalnızca bundan sonraki yeni/değişen kayıtları doğrular. İdempotent.
--  Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

-- --- OYUNCULAR: boy/kilo makul aralık ---
alter table public.oyuncular drop constraint if exists chk_oyuncu_boy;
alter table public.oyuncular add  constraint chk_oyuncu_boy  check (boy  is null or (boy  between 100 and 250)) not valid;
alter table public.oyuncular drop constraint if exists chk_oyuncu_kilo;
alter table public.oyuncular add  constraint chk_oyuncu_kilo check (kilo is null or (kilo between 30  and 200)) not valid;

-- --- MAÇLAR: skorlar negatif olamaz ---
alter table public.maclar drop constraint if exists chk_mac_skor;
alter table public.maclar add  constraint chk_mac_skor check (
  (ev_skor is null or ev_skor >= 0) and (dep_skor is null or dep_skor >= 0)
) not valid;

-- --- PROFİLLER: boy/kilo makul aralık ---
alter table public.profiller drop constraint if exists chk_profil_boy;
alter table public.profiller add  constraint chk_profil_boy  check (boy  is null or (boy  between 100 and 250)) not valid;
alter table public.profiller drop constraint if exists chk_profil_kilo;
alter table public.profiller add  constraint chk_profil_kilo check (kilo is null or (kilo between 30  and 200)) not valid;

-- --- LİG BAŞVURULARI: bir kullanıcının aynı anda tek AKTİF başvurusu ---
create unique index if not exists ux_basvuru_aktif
  on public.lig_basvurulari(user_id)
  where (durum in ('bekliyor','arandi') and user_id is not null);

-- =====================================================================
--  BİTTİ. (İsteğe bağlı: eski veriyi de doğrulamak istersen
--   'alter table ... validate constraint chk_...;' — ama gerekmez.)
-- =====================================================================
