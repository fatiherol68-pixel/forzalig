-- =====================================================================
--  ForzaLig — 75: SÜPER ADMİN ANKET SİSTEMİ (Faz 1+2) — TABLOLAR + RLS
--
--  Tek merkezî anket: bir anket 40 takıma gönderilse bile TEK kayıttır.
--  Oylar/yorumlar bölünmeden merkezde toplanır. Gizli oyda kullanıcı↔seçim
--  bağı HİÇ yazılmaz. Yazma işlemleri yalnız SECURITY DEFINER RPC ile
--  (76_anket_rpc.sql) ve admin_mi() kontrolüyle yapılır → tablo RLS'i
--  esas olarak doğrudan okumayı ve çift-oyu güvene alır.
--
--  ADDITIVE: Mevcut hiçbir tabloyu/politikayı değiştirmez. İdempotent.
--  Supabase → SQL Editor → Run. 76'dan ÖNCE çalıştır.
-- =====================================================================

-- 1) ANKET ana kaydı ------------------------------------------------------
create table if not exists public.anketler(
  id           uuid primary key default gen_random_uuid(),
  baslik       text not null,
  aciklama     text,
  gorsel       text,
  tip          text not null default 'tek',            -- tek | coklu
  max_secim    int  not null default 1,                -- coklu için üst sınır
  yorum_acik   boolean not null default true,
  gizli_oy     boolean not null default false,
  oy_degistir  boolean not null default true,
  sonuc_gorunur text not null default 'oydan_sonra',   -- oydan_sonra|bitince|admin|gizli
  baslar       timestamptz,
  biter        timestamptz,
  durum        text not null default 'taslak',         -- taslak|zamanli|yayin|durdu|bitti|iptal|arsiv
  olusturan    uuid,
  created      timestamptz not null default now()
);
create index if not exists ix_anket_durum on public.anketler(durum);

-- 2) SEÇENEKLER -----------------------------------------------------------
create table if not exists public.anket_secenek(
  id       uuid primary key default gen_random_uuid(),
  anket_id uuid not null references public.anketler(id) on delete cascade,
  metin    text not null,
  sira     int  not null default 0
);
create index if not exists ix_anket_secenek on public.anket_secenek(anket_id, sira);

-- 3) HEDEF (kime gösterilecek — kural başına bir satır) --------------------
create table if not exists public.anket_hedef(
  id        uuid primary key default gen_random_uuid(),
  anket_id  uuid not null references public.anketler(id) on delete cascade,
  kapsam    text not null,          -- takim | lig | lig_takimlari | rol | kullanici | tum
  kapsam_id uuid,                   -- takim_id / lig_id / user_id (tum/rol için null)
  rol_filtre text                   -- rol için: kaptan | lig_yon | aktif
);
create index if not exists ix_anket_hedef on public.anket_hedef(anket_id);

-- 4) AÇIK OY (kullanıcı↔seçim görünür) ------------------------------------
create table if not exists public.anket_oy(
  id         uuid primary key default gen_random_uuid(),
  anket_id   uuid not null references public.anketler(id) on delete cascade,
  user_id    uuid not null,
  secenek_id uuid not null references public.anket_secenek(id) on delete cascade,
  lig_id     uuid,
  takim_id   uuid,
  created    timestamptz not null default now()
);
-- Çoklu seçimi destekler; tek seçim RPC'de eski oyları silerek zorlanır.
create unique index if not exists ux_anket_oy on public.anket_oy(anket_id, user_id, secenek_id);
create index if not exists ix_anket_oy_a on public.anket_oy(anket_id);

-- 5) KATILIM (gizli oy: "oy verdi" işareti — kim-ne bağı YOK) --------------
create table if not exists public.anket_katilim(
  anket_id uuid not null references public.anketler(id) on delete cascade,
  user_id  uuid not null,
  created  timestamptz not null default now(),
  primary key(anket_id, user_id)
);

-- 6) SAYAÇ (anonim artımlı sonuç — gizli oyla da uyumlu) -------------------
create table if not exists public.anket_oy_sayac(
  anket_id   uuid not null references public.anketler(id) on delete cascade,
  secenek_id uuid not null references public.anket_secenek(id) on delete cascade,
  adet       int  not null default 0,
  primary key(anket_id, secenek_id)
);

-- 7) YORUMLAR (ankete özel — tek merkez) ----------------------------------
create table if not exists public.anket_yorum(
  id           uuid primary key default gen_random_uuid(),
  anket_id     uuid not null references public.anketler(id) on delete cascade,
  user_id      uuid not null,
  ad           text,
  takim_ad     text,
  lig_ad       text,
  metin        text not null,
  secenek_gorun boolean not null default false,
  silindi      boolean not null default false,
  created      timestamptz not null default now()
);
create index if not exists ix_anket_yorum on public.anket_yorum(anket_id, created);

-- =====================================================================
--  RLS — okuma güvenli; yazma yalnız RPC (SECURITY DEFINER) üzerinden.
-- =====================================================================
alter table public.anketler       enable row level security;
alter table public.anket_secenek  enable row level security;
alter table public.anket_hedef    enable row level security;
alter table public.anket_oy       enable row level security;
alter table public.anket_katilim  enable row level security;
alter table public.anket_oy_sayac enable row level security;
alter table public.anket_yorum    enable row level security;

-- ANKETLER: yayınlanmışı herkes okur; taslak/iptal yalnız admin. Yazma yok (RPC).
drop policy if exists p_anket_sel on public.anketler;
create policy p_anket_sel on public.anketler for select to authenticated
  using ( durum in ('yayin','durdu','bitti','arsiv') or public.admin_mi() );

-- SEÇENEKLER: herkes okur (yayınlı anketin seçenekleri).
drop policy if exists p_anket_sec_sel on public.anket_secenek;
create policy p_anket_sec_sel on public.anket_secenek for select to authenticated using ( true );

-- HEDEF: yalnız admin okur (hedefleme iç bilgi).
drop policy if exists p_anket_hedef_sel on public.anket_hedef;
create policy p_anket_hedef_sel on public.anket_hedef for select to authenticated using ( public.admin_mi() );

-- AÇIK OY: kişi kendi oyunu, admin hepsini okur. Doğrudan yazma KAPALI (RPC).
drop policy if exists p_anket_oy_sel on public.anket_oy;
create policy p_anket_oy_sel on public.anket_oy for select to authenticated
  using ( user_id = auth.uid() or public.admin_mi() );

-- KATILIM: kişi kendi işaretini, admin hepsini okur.
drop policy if exists p_anket_kat_sel on public.anket_katilim;
create policy p_anket_kat_sel on public.anket_katilim for select to authenticated
  using ( user_id = auth.uid() or public.admin_mi() );

-- SAYAÇ: herkes okur (anonim toplam).
drop policy if exists p_anket_sayac_sel on public.anket_oy_sayac;
create policy p_anket_sayac_sel on public.anket_oy_sayac for select to authenticated using ( true );

-- YORUM: silinmemiş yorumları herkes okur; admin hepsini. Yazma yok (RPC).
drop policy if exists p_anket_yorum_sel on public.anket_yorum;
create policy p_anket_yorum_sel on public.anket_yorum for select to authenticated
  using ( silindi = false or public.admin_mi() );

grant select on public.anketler, public.anket_secenek, public.anket_hedef,
  public.anket_oy, public.anket_katilim, public.anket_oy_sayac, public.anket_yorum
  to authenticated;

-- KONTROL
select 'anket_tablo' as ne,
  (select count(*)::text from information_schema.tables
     where table_schema='public' and table_name in
     ('anketler','anket_secenek','anket_hedef','anket_oy','anket_katilim','anket_oy_sayac','anket_yorum')) as sonuc;
