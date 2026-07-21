-- =====================================================================
--  ForzaLig — SİSTEM ANAHTARLARI (Feature Flag + Bakım Modu)
--  Basit anahtar-değer tablosu. Herkes OKUR (uygulama bayrakları için),
--  yalnızca Süper Admin YAZAR. Bir kez çalıştır (Faz 3'ü aktifleştirir).
-- =====================================================================

create table if not exists public.sistem_ayar (
  anahtar     text primary key,
  deger       text,
  guncelleme  timestamptz not null default now()
);

alter table public.sistem_ayar enable row level security;

-- Herkes okuyabilir (uygulama açılışta bakım modu / bayrakları okur)
drop policy if exists p_ayar_sel on public.sistem_ayar;
create policy p_ayar_sel on public.sistem_ayar for select using (true);

-- Yalnızca Süper Admin yazar
drop policy if exists p_ayar_ins on public.sistem_ayar;
create policy p_ayar_ins on public.sistem_ayar for insert to authenticated with check (public.admin_mi());
drop policy if exists p_ayar_upd on public.sistem_ayar;
create policy p_ayar_upd on public.sistem_ayar for update to authenticated using (public.admin_mi()) with check (public.admin_mi());

grant select on public.sistem_ayar to anon, authenticated;
grant insert, update on public.sistem_ayar to authenticated;

-- Başlangıç değerleri (kapalı)
insert into public.sistem_ayar(anahtar, deger) values ('bakim','0'), ('yeni_ozellik','0')
  on conflict (anahtar) do nothing;
