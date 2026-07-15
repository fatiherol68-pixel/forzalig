-- =====================================================================
--  ForzaLig — HATA / ÇÖKME LOG (Faz 4)
--  Sitede biri çökme yaşadığında hata kalkanı otomatik buraya yazar.
--  Süper admin panelde son hataları görür. Giriş yapan yazabilir,
--  sadece admin okur/siler.
--  Bir kez çalıştır. Idempotent.
-- =====================================================================

create table if not exists public.hata_log (
  id      uuid primary key default gen_random_uuid(),
  mesaj   text not null,
  sayfa   text,
  user_id uuid,
  cihaz   text,
  olusma  timestamptz not null default now()
);

alter table public.hata_log enable row level security;

-- giriş yapan herkes hata yazabilir (kendi çökmesini raporlar)
drop policy if exists p_hata_ins on public.hata_log;
create policy p_hata_ins on public.hata_log for insert to authenticated with check (true);

-- sadece admin okur
drop policy if exists p_hata_sel on public.hata_log;
create policy p_hata_sel on public.hata_log for select to authenticated
  using (exists(select 1 from public.adminler a where a.user_id = auth.uid()));

-- sadece admin siler
drop policy if exists p_hata_del on public.hata_log;
create policy p_hata_del on public.hata_log for delete to authenticated
  using (exists(select 1 from public.adminler a where a.user_id = auth.uid()));

grant insert, select, delete on public.hata_log to authenticated;
