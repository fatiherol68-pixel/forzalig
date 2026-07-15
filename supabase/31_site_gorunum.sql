-- =====================================================================
--  ForzaLig — GLOBAL SİTE GÖRÜNÜMÜ (stil + renk)
--  Amaç: Süper admin görünümü değiştirince TÜM ziyaretçiler aynı görünümü
--  görsün (cihaz bağımsız). Tek satırlık ayar tablosu + realtime.
--  Sadece süper admin (public.adminler) güncelleyebilir; herkes okuyabilir.
--  Bir kez çalıştır. Tekrar çalıştırmak güvenli (idempotent).
-- =====================================================================

create table if not exists public.site_ayar (
  id         smallint primary key default 1,
  stil_key   text not null default 'zumrut',
  renk_key   text not null default '',
  guncelleyen uuid,
  guncelleme timestamptz not null default now(),
  constraint site_ayar_tek_satir check (id = 1)
);

-- Tek satırı garanti et
insert into public.site_ayar (id) values (1) on conflict (id) do nothing;

alter table public.site_ayar enable row level security;

-- Herkes (giriş yapmamış dahil) okuyabilir
drop policy if exists p_site_sel on public.site_ayar;
create policy p_site_sel on public.site_ayar for select using (true);

-- Sadece süper admin güncelleyebilir
drop policy if exists p_site_upd on public.site_ayar;
create policy p_site_upd on public.site_ayar for update to authenticated
  using      (exists (select 1 from public.adminler a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.adminler a where a.user_id = auth.uid()));

grant select on public.site_ayar to anon, authenticated;
grant update on public.site_ayar to authenticated;

-- Realtime: değişiklik anında tüm açık istemcilere düşsün ("aynı anda")
do $$
begin
  alter publication supabase_realtime add table public.site_ayar;
exception when others then null;  -- zaten ekliyse / publication yoksa sessiz geç
end $$;
