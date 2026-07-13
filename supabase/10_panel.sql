-- =====================================================================
--  ForzaLig — ADMIN PANEL veri tabloları (audit log · analitik · takip)
--  14 Audit · 4/7/8 Analitik · 10 Popüler için. 01-09'dan SONRA çalıştır.
-- =====================================================================

-- ---- 14) İŞLEM LOGU (audit) — kim, ne zaman, ne yaptı ----
create table if not exists public.islem_log (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  kim     text,                 -- e-posta/ad (hızlı okuma için)
  islem   text not null,        -- ör. "Lig hakkı verdi", "Transfer onayladı"
  detay   text,                 -- serbest açıklama
  created timestamptz not null default now()
);
create index if not exists ix_log_created on public.islem_log(created desc);
alter table public.islem_log enable row level security;
drop policy if exists p_islemlog_sel on public.islem_log;
create policy p_islemlog_sel on public.islem_log for select to authenticated using (public.admin_mi());
drop policy if exists p_islemlog_ins on public.islem_log;
create policy p_islemlog_ins on public.islem_log for insert to authenticated with check (user_id = auth.uid());
grant select, insert on public.islem_log to authenticated;

-- ---- 4/7/8) OLAY LOGU (analitik) — sayfa görüntüleme + arama ----
create table if not exists public.olay_log (
  id      bigint generated always as identity primary key,
  tip     text not null,        -- 'sayfa' | 'arama'
  deger   text,                 -- sayfa adı veya arama sorgusu
  user_id uuid,
  created timestamptz not null default now()
);
create index if not exists ix_olay_tip_created on public.olay_log(tip, created desc);
alter table public.olay_log enable row level security;
drop policy if exists p_olay_ins on public.olay_log;
create policy p_olay_ins on public.olay_log for insert to anon, authenticated with check (true);  -- herkes olay yazabilir
drop policy if exists p_olay_sel on public.olay_log;
create policy p_olay_sel on public.olay_log for select to authenticated using (public.admin_mi());
grant insert on public.olay_log to anon, authenticated;
grant select on public.olay_log to authenticated;

-- ---- 10) TAKİPLER (popüler hesabı için) ----
create table if not exists public.takipler (
  user_id  uuid not null references auth.users(id) on delete cascade,
  tip      text not null,       -- 'lig' | 'takim' | 'oyuncu'
  hedef_id text not null,       -- ilgili id
  hedef_ad text,                -- gösterim için ad
  created  timestamptz not null default now(),
  primary key (user_id, tip, hedef_id)
);
create index if not exists ix_takip_hedef on public.takipler(tip, hedef_id);
alter table public.takipler enable row level security;
drop policy if exists p_takip_sel on public.takipler;
create policy p_takip_sel on public.takipler for select using (true);   -- popüler herkese görünür
drop policy if exists p_takip_yaz on public.takipler;
create policy p_takip_yaz on public.takipler for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select on public.takipler to anon, authenticated;
grant insert, delete on public.takipler to authenticated;
