-- 72_oyuncu_deger.sql — Oyuncu Değer Sistemi (Faz 0)
--
-- Amaç:
--   1) Mevcut oyuncu değerlerini 750.000 € (750 Bin €) TABANA çek.
--      Eski değer, OVR³/180 formülüyle "milyon" ölçeğindeydi (ör. 234 = €234M) — artık
--      değer TAM EURO olarak tutulur ve varsayılan temel 750.000'dir.
--   2) Değer geçmişi tablosu (manuel değişiklikler loglanır).
--   3) (Opsiyonel) değer kilidi kolonu — ileride otomatik hesabı dondurmak için.
--
-- GÜVENLİ: Kod bu SQL olmadan da çalışır — uygulama, değeri 50.000'in altında olan
-- (eski ölçek) oyuncuları zaten 750.000 varsayar. Bu dosya veritabanını da temizler.
-- Idempotent: birden çok kez çalıştırılabilir.

-- 1) Eski ölçekli / boş değerleri 750.000 € tabana çek
update public.oyuncular
   set deger = 750000
 where deger is null or deger < 50000;

-- 2) Değer geçmişi (denetim kaydı)
create table if not exists public.deger_gecmisi (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid references public.oyuncular(player_id) on delete cascade,
  onceki     numeric,
  yeni       numeric,
  fark       numeric,
  temel      numeric,
  kaynak     text,               -- manuel / mac / odul / sistem
  aciklama   text,
  isleyen    uuid,
  tarih      timestamptz not null default now()
);
create index if not exists ix_deger_gecmisi_player on public.deger_gecmisi(player_id);

alter table public.deger_gecmisi enable row level security;
-- Sadece süper admin yazar/okur (RLS)
drop policy if exists deger_gecmisi_admin on public.deger_gecmisi;
create policy deger_gecmisi_admin on public.deger_gecmisi
  for all using (public.admin_mi()) with check (public.admin_mi());

-- 3) (Opsiyonel) değer kilidi — otomatik performans artışını dondurmak için
alter table public.oyuncular add column if not exists deger_kilit boolean not null default false;
