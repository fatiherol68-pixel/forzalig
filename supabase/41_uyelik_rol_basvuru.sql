-- =====================================================================
--  ForzaLig — ÜYELİK ROLLERİ + LİG BAŞVURUSU + TEKNİK DİREKTÖR
--  Faz 1-4 (rol seçimi / hakem havuzu / lig başvurusu / TD atama)
--  Supabase → SQL Editor'e TEK SEFERDE yapıştır, çalıştır. İdempotent.
--  01-40'tan SONRA çalışır. Mevcut veriyi BOZMAZ.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PROFİLLER — rol/profil alanları (Faz 1)
--    rol    : birincil seçim (futbolcu / hakem / izleyici)
--    roller : çoklu yetki bayrakları {"futbolcu":true,"hakem":true,"td":true}
--    Kişisel detay (dogum/boy/kilo) profil sahibinin + adminin görebildiği
--    satırda; hakem havuzu için AYRI güvenli view (aşağıda) kullanılır.
-- ---------------------------------------------------------------------
alter table public.profiller add column if not exists rol    text;
alter table public.profiller add column if not exists roller jsonb not null default '{}'::jsonb;
alter table public.profiller add column if not exists sehir  text;
alter table public.profiller add column if not exists foto   text;
alter table public.profiller add column if not exists dogum  date;
alter table public.profiller add column if not exists boy    int;
alter table public.profiller add column if not exists kilo   int;
alter table public.profiller add column if not exists mevki  text;
alter table public.profiller add column if not exists ayak   text;

-- Kişi kendi profilini oluşturabilsin (upsert için; trigger zaten kurar ama garanti)
drop policy if exists p_profil_ins on public.profiller;
create policy p_profil_ins on public.profiller for insert to authenticated
  with check (public.admin_mi() or user_id = auth.uid());
grant insert on public.profiller to authenticated;

-- ---------------------------------------------------------------------
-- 2) HAKEM HAVUZU — güvenli görünüm (Faz 3)
--    Lig yöneticileri maça hakem atarken bu view'i okur. Sadece
--    hakem rolü olanlar + yalnızca ZARARSIZ alanlar (telefon/dogum YOK).
-- ---------------------------------------------------------------------
create or replace view public.hakem_havuzu as
  select user_id, ad, sehir, foto
  from public.profiller
  where roller @> '{"hakem":true}'::jsonb;

grant select on public.hakem_havuzu to authenticated;

-- ---------------------------------------------------------------------
-- 3) LİG KURMA BAŞVURULARI (Faz 2)
--    Kişi "+ Lig Kur" deyince (yetkisi yoksa) buraya düşer.
--    ad/telefon/email ZORUNLU → süper admin arar, ödeme alınca hak verir.
--    Güvenlik: kişi kendi başvurusunu ekler; SADECE admin okur/günceller
--    (telefon KVKK → herkese açık değil).
-- ---------------------------------------------------------------------
create table if not exists public.lig_basvurulari (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  ad_soyad     text not null,
  telefon      text not null,
  email        text not null,
  lig_ad       text,
  sehir        text,
  takim_sayisi int,
  mesaj        text,
  durum        text not null default 'bekliyor',   -- bekliyor / arandi / onaylandi / red
  olusturma    timestamptz not null default now()
);
create index if not exists ix_basvuru_durum on public.lig_basvurulari(durum, olusturma desc);

alter table public.lig_basvurulari enable row level security;

drop policy if exists p_basvuru_ins on public.lig_basvurulari;
create policy p_basvuru_ins on public.lig_basvurulari for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists p_basvuru_sel on public.lig_basvurulari;
create policy p_basvuru_sel on public.lig_basvurulari for select to authenticated
  using (public.admin_mi() or user_id = auth.uid());   -- admin hepsini, kişi kendininkini

drop policy if exists p_basvuru_upd on public.lig_basvurulari;
create policy p_basvuru_upd on public.lig_basvurulari for update to authenticated
  using (public.admin_mi()) with check (public.admin_mi());   -- durumu sadece admin değiştirir

grant insert, select on public.lig_basvurulari to authenticated;
grant update on public.lig_basvurulari to authenticated;

-- ---------------------------------------------------------------------
-- 4) TAKIM — teknik direktör alanı (Faz 4)
--    Takıma bağlı rol. Yönetici/admin atar; {"ad":"...","foto":"..."}
--    Güncelleme mevcut takimlar update politikasıyla korunur (logo gibi).
-- ---------------------------------------------------------------------
alter table public.takimlar add column if not exists td jsonb;

-- =====================================================================
--  BİTTİ. Test:  select rol, roller from public.profiller limit 5;
--                select * from public.hakem_havuzu;
--                select * from public.lig_basvurulari order by olusturma desc;
-- =====================================================================
