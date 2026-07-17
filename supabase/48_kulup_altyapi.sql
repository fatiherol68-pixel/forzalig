-- =====================================================================
--  ForzaLig — AŞAMA 2: KULÜP ALTYAPISI (görünmez / additive)
--  Takımı ligden bağımsız KALICI kimliğe kavuşturur. Hiçbir mevcut
--  tabloyu/fonksiyonu DEĞİŞTİRMEZ; sadece yeni tablo/kolon/RLS ekler.
--  player_id omurgasının aynısı: geri uyumlu, idempotent.
--  Bu SQL çalışsa da UI değişmez — sistem aynen çalışmaya devam eder.
--  Supabase → SQL Editor → yapıştır → Run. Bir kez. İdempotent.
-- =====================================================================

-- 1) KULÜPLER — kalıcı kulüp kimliği (lige bağlı DEĞİL, kullanıcıya bağlı)
create table if not exists public.kulupler (
  id             uuid primary key default gen_random_uuid(),
  ad             text not null,
  logo           text,
  renk           text,
  renk2          text,
  td             jsonb,                              -- teknik direktör {ad, foto} (kulüp seviyesinde)
  sahip_user_id  uuid references auth.users(id) on delete set null,  -- kaptan/sahip (öksüz kalırsa admin devreder)
  evren          text,                               -- demo/evren işareti (null = gerçek kulüp)
  durum          text not null default 'aktif',
  olusturma      timestamptz not null default now()
);
create index if not exists ix_kulupler_sahip on public.kulupler(sahip_user_id);
create index if not exists ix_kulupler_evren on public.kulupler(evren);

-- 2) KULÜP_OYUNCU — kulübün ANA KADROSU (ligsizken bile durur; tek gerçek kaynak)
create table if not exists public.kulup_oyuncu (
  kulup_id   uuid not null references public.kulupler(id) on delete cascade,
  player_id  uuid not null references public.oyuncular(player_id) on delete cascade,
  aktif      boolean not null default true,
  forma_no   int,
  mevki      text,
  katilma    timestamptz not null default now(),
  primary key (kulup_id, player_id)
);
create index if not exists ix_kulup_oyuncu_player on public.kulup_oyuncu(player_id);

-- 3) TAKIMLAR → kulüp bağı. lig_id NOT NULL AYNEN KALIR (geri uyum).
--    takim = "kulübün bir ligdeki örneği". kulup_id null olabilir (eski satırlar).
alter table public.takimlar add column if not exists kulup_id uuid references public.kulupler(id) on delete set null;
create index if not exists ix_takimlar_kulup on public.takimlar(kulup_id);

-- 4) YARDIMCI: bu kulübün yöneticisi/admin miyim? (lig_yoneticim kalıbı)
create or replace function public.kulup_yoneticim(k uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.admin_mi()
      or exists(select 1 from public.kulupler c where c.id = k and c.sahip_user_id = auth.uid());
$$;
grant execute on function public.kulup_yoneticim(uuid) to authenticated;

-- 5) RLS — KULÜPLER
alter table public.kulupler enable row level security;
drop policy if exists p_kulup_sel on public.kulupler;
create policy p_kulup_sel on public.kulupler for select to authenticated
  using (evren is null or public.admin_mi());           -- demo kulüpler normal kullanıcıdan gizli
drop policy if exists p_kulup_ins on public.kulupler;
create policy p_kulup_ins on public.kulupler for insert to authenticated
  with check (public.admin_mi() or sahip_user_id = auth.uid());
drop policy if exists p_kulup_upd on public.kulupler;
create policy p_kulup_upd on public.kulupler for update to authenticated
  using (public.kulup_yoneticim(id)) with check (public.kulup_yoneticim(id));
drop policy if exists p_kulup_del on public.kulupler;
create policy p_kulup_del on public.kulupler for delete to authenticated
  using (public.admin_mi() or sahip_user_id = auth.uid());
grant select, insert, update, delete on public.kulupler to authenticated;

-- 6) RLS — KULÜP_OYUNCU (kadro görünür; yazma sadece kulüp yöneticisi)
alter table public.kulup_oyuncu enable row level security;
drop policy if exists p_kulupoy_sel on public.kulup_oyuncu;
create policy p_kulupoy_sel on public.kulup_oyuncu for select to authenticated using (true);
drop policy if exists p_kulupoy_ins on public.kulup_oyuncu;
create policy p_kulupoy_ins on public.kulup_oyuncu for insert to authenticated
  with check (public.kulup_yoneticim(kulup_id));
drop policy if exists p_kulupoy_upd on public.kulup_oyuncu;
create policy p_kulupoy_upd on public.kulup_oyuncu for update to authenticated
  using (public.kulup_yoneticim(kulup_id)) with check (public.kulup_yoneticim(kulup_id));
drop policy if exists p_kulupoy_del on public.kulup_oyuncu;
create policy p_kulupoy_del on public.kulup_oyuncu for delete to authenticated
  using (public.kulup_yoneticim(kulup_id));
grant select, insert, update, delete on public.kulup_oyuncu to authenticated;

-- =====================================================================
--  BİTTİ. Sadece yapı eklendi — hiçbir mevcut veri/akış değişmedi.
--  Sıradaki aşamalarda: backfill (eski takımlar → kulüp) + otomatik kadro.
-- =====================================================================
