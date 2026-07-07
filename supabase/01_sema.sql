-- =====================================================================
--  ForzaLig — İLİŞKİSEL VERİTABANI ŞEMASI (Faz 1 · temel)
--  Bu dosya Supabase → SQL Editor'e TEK SEFERDE yapıştırılıp çalıştırılır.
--  Mevcut tabloları (kullanici_veri, paylasilan_ligler...) BOZMAZ —
--  yeni tablolar onların YANINA kurulur. Güvenli, geri alınabilir.
--
--  Karşıladığı kararlar:
--   K1 İlişkisel yapı · K2 Çoklu admin · K3/K4 Lig hakkı · K7 KVKK
--   K8 Sunucu güvenliği (RLS) · K9 Ülke alanı  +  25 iş kuralı
--  Her tablo idempotent: tekrar çalıştırılabilir, hata vermez.
-- =====================================================================

-- gen_random_uuid() için (Supabase'de genelde açık, garanti olsun)
create extension if not exists pgcrypto;

-- =====================================================================
-- 1) KİMLİK & YETKİ
-- =====================================================================

-- 1.1 Adminler (Süper Admin listesi) — K2: artık kodda değil, burada.
create table if not exists public.adminler (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  ekleyen    uuid references auth.users(id),
  eklenme    timestamptz not null default now()
);
comment on table public.adminler is 'Süper Admin listesi (K2). İlk admin elle eklenir (aşağıda 05_ilk_admin.sql).';

-- Yardımcı: giriş yapan kişi admin mi? (RLS kurallarında kullanılır)
create or replace function public.admin_mi()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.adminler a where a.user_id = auth.uid());
$$;

-- 1.2 Lig açma hakları — K3/K4: kim kaç lig açabilir.
create table if not exists public.lig_haklari (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  toplam     int  not null default 0,       -- Süper Admin'in verdiği toplam hak
  kullanilan int  not null default 0,       -- açılan lig sayısı (otomatik güncellenir)
  not_        text,                          -- admin notu (ör. "IBAN 12.07 geldi")
  guncelleme timestamptz not null default now()
);
comment on table public.lig_haklari is 'K3/K4: kullanıcı başına lig açma hakkı. kalan = toplam - kullanilan.';

-- =====================================================================
-- 2) LİG YAPISI
-- =====================================================================

-- 2.1 Ligler — K9 ülke, kural kilitleme (madde 21), arşiv (madde 22)
create table if not exists public.ligler (
  id            uuid primary key default gen_random_uuid(),
  yonetici_id   uuid not null references auth.users(id),
  ad            text not null,
  ulke          text not null default 'TR',        -- K9: TR / AT / DE ...
  sehir         text,
  logo          text,
  puan_sistemi  jsonb  not null default '{"galibiyet":3,"beraberlik":1,"maglubiyet":0}',
  averaj_tipi   text   not null default 'averaj',  -- averaj / ikili_averaj ...
  fikstur_tipi  text   not null default 'tek_devre',
  hedef_takim   int    not null default 8,         -- madde 11: hedef (sabit değil)
  kurallar_kilit boolean not null default false,   -- madde 21: maç oynanınca true
  durum         text   not null default 'aktif',   -- aktif / arsiv (madde 22)
  bitis_tarihi  date,
  olusturma     timestamptz not null default now()
);
create index if not exists ix_ligler_yonetici on public.ligler(yonetici_id);
create index if not exists ix_ligler_ulke_durum on public.ligler(ulke, durum);
comment on column public.ligler.kurallar_kilit is 'Madde 21: ilk maç oynanınca puan/averaj/fikstür kilitlenir.';

-- 2.2 Takımlar — madde 5 (önce sadece ad), madde 23 (maç yaptıysa pasif)
create table if not exists public.takimlar (
  id           uuid primary key default gen_random_uuid(),
  lig_id       uuid not null references public.ligler(id) on delete cascade,
  ad           text not null,
  logo         text,
  forma        jsonb,                               -- renk/desen bilgisi
  yonetici_id  uuid references auth.users(id),      -- madde 10: opsiyonel
  durum        text not null default 'aktif',       -- aktif / pasif (madde 23)
  olusturma    timestamptz not null default now()
);
create index if not exists ix_takimlar_lig on public.takimlar(lig_id);

-- 2.3 Oyuncular — K7 KVKK: hassas alanlar burada, dışarı VIEW ile açılır.
--     Player ID = kalıcı kimlik (madde 7). İsim/telefon değişir, id asla.
create table if not exists public.oyuncular (
  player_id    uuid primary key default gen_random_uuid(),   -- 🔑 ASLA DEĞİŞMEZ
  ad_soyad     text not null,
  takma_ad     text,                                          -- K7: opsiyonel görünen ad
  forma_no     int,
  dogum        date,        -- 🔒 gizli — dışarı sadece YAŞ olarak çıkar
  ayak         text,        -- 👁️ sağ/sol/çift
  boy          int,         -- 👁️ cm
  kilo         int,         -- 🔒 gizli
  telefon      text,        -- 🔒 gizli
  email        text,        -- 🔒 gizli
  tc_pasaport  text,        -- 🔒 gizli
  uyruk        text,        -- 🔒 gizli
  sahip_user_id uuid references auth.users(id),  -- madde 8: kariyeri sahiplenen üye (null olabilir)
  durum        text not null default 'aktif',    -- aktif / pasif (madde 24: silinmez)
  olusturma    timestamptz not null default now()
);
create index if not exists ix_oyuncular_sahip on public.oyuncular(sahip_user_id);
comment on table public.oyuncular is 'K7: dogum/kilo/telefon/email/tc/uyruk GİZLİ. Dışarı public.oyuncular_acik view''i ile çıkar.';

-- =====================================================================
-- 3) OYUNCU ↔ TAKIM & TRANSFER
-- =====================================================================

-- 3.1 Oyuncu-Takım üyeliği — madde 12: bir ligde aynı anda 1 aktif takım
create table if not exists public.oyuncu_takim (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.oyuncular(player_id) on delete cascade,
  takim_id      uuid not null references public.takimlar(id) on delete cascade,
  lig_id        uuid not null references public.ligler(id) on delete cascade,
  aktif         boolean not null default true,
  katilma       timestamptz not null default now(),
  ayrilma       timestamptz
);
create index if not exists ix_ot_player on public.oyuncu_takim(player_id);
create index if not exists ix_ot_takim  on public.oyuncu_takim(takim_id);
-- madde 12 kilidi: bir oyuncu, bir ligde yalnızca 1 AKTİF üyelik
create unique index if not exists ux_ot_tek_aktif
  on public.oyuncu_takim(player_id, lig_id) where (aktif);

-- 3.2 Transferler — K6/madde 13: 3 adımlı resmi zincir, madde 14: geçmiş saklanır
create table if not exists public.transferler (
  id             uuid primary key default gen_random_uuid(),
  player_id      uuid not null references public.oyuncular(player_id),
  lig_id         uuid not null references public.ligler(id),
  eski_takim_id  uuid references public.takimlar(id),
  yeni_takim_id  uuid not null references public.takimlar(id),
  asama          text not null default 'talep',  -- talep → oyuncu_kabul → yonetici_onay → tamam / iptal
  talep_eden     uuid references auth.users(id),
  talep_tarihi   timestamptz not null default now(),
  oyuncu_kabul_t timestamptz,
  yonetici_onay_t timestamptz,
  tamam_t        timestamptz
);
create index if not exists ix_transfer_player on public.transferler(player_id);
create index if not exists ix_transfer_lig on public.transferler(lig_id, asama);

-- =====================================================================
-- 4) MAÇ
-- =====================================================================

-- 4.1 Maçlar — madde 16/17
create table if not exists public.maclar (
  id           uuid primary key default gen_random_uuid(),
  lig_id       uuid not null references public.ligler(id) on delete cascade,
  ev_takim_id  uuid not null references public.takimlar(id),
  dep_takim_id uuid not null references public.takimlar(id),
  tarih        timestamptz,
  hafta        int,
  ev_skor      int,
  dep_skor     int,
  oynandi      boolean not null default false,
  olusturma    timestamptz not null default now()
);
create index if not exists ix_maclar_lig on public.maclar(lig_id);

-- 4.2 Maç sonucu değişiklik logu — madde 18: kim/ne zaman/eski/yeni
create table if not exists public.mac_sonuc_log (
  id          uuid primary key default gen_random_uuid(),
  mac_id      uuid not null references public.maclar(id) on delete cascade,
  eski_ev     int, eski_dep int,
  yeni_ev     int, yeni_dep int,
  degistiren  uuid references auth.users(id),
  zaman       timestamptz not null default now()
);
create index if not exists ix_log_mac on public.mac_sonuc_log(mac_id);

-- 4.3 Maç olayları (gol/asist/kart) — kariyer istatistiği buradan toplanır
create table if not exists public.mac_olaylari (
  id          uuid primary key default gen_random_uuid(),
  mac_id      uuid not null references public.maclar(id) on delete cascade,
  player_id   uuid not null references public.oyuncular(player_id),
  takim_id    uuid references public.takimlar(id),
  tip         text not null,          -- gol / asist / sari / kirmizi
  dakika      int
);
create index if not exists ix_olay_mac on public.mac_olaylari(mac_id);
create index if not exists ix_olay_player on public.mac_olaylari(player_id);

-- 4.4 İlk 11 — madde 19: opsiyonel
create table if not exists public.ilk11 (
  id         uuid primary key default gen_random_uuid(),
  mac_id     uuid not null references public.maclar(id) on delete cascade,
  takim_id   uuid not null references public.takimlar(id),
  player_id  uuid not null references public.oyuncular(player_id)
);
create index if not exists ix_ilk11_mac on public.ilk11(mac_id);

-- 4.5 Katılım — madde 20: geliyorum / gelemiyorum / belki
create table if not exists public.katilim (
  mac_id     uuid not null references public.maclar(id) on delete cascade,
  player_id  uuid not null references public.oyuncular(player_id) on delete cascade,
  durum      text not null default 'belki',    -- geliyorum / gelemiyorum / belki
  guncelleme timestamptz not null default now(),
  primary key (mac_id, player_id)
);

-- =====================================================================
-- 5) KVKK AÇIK GÖRÜNÜMLER (K7) — dışarıya sadece izinli alanlar
--    Ziyaretçi bu view'leri görür; hassas sütunlar (dogum tam tarih,
--    telefon, mail, kilo, tc, uyruk) ASLA çıkmaz. Doğum → yaş'a çevrilir.
-- =====================================================================
create or replace view public.oyuncular_acik as
  select
    player_id,
    coalesce(nullif(takma_ad,''), ad_soyad) as gorunen_ad,  -- takma ad varsa onu göster
    forma_no,
    ayak,
    boy,
    case when dogum is not null
         then extract(year from age(dogum))::int end as yas,  -- 🔒 tarih değil, YAŞ
    durum
  from public.oyuncular;

comment on view public.oyuncular_acik is 'K7 KVKK: ziyaretçiye açık oyuncu görünümü. Hassas alanlar yok, doğum→yaş.';

-- =====================================================================
--  Not: RLS (satır güvenliği) ve tetikleyiciler (kilitleme, hak sayacı,
--  sonuç logu) ayrı dosyada: 02_guvenlik.sql  ·  03_tetikleyiciler.sql
-- =====================================================================
