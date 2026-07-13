-- =====================================================================
--  ForzaLig — SOHBET (lig geneli + takım içi, Supabase Realtime)
--  01_sema.sql + 02_guvenlik.sql'den SONRA çalıştır.
-- =====================================================================

create table if not exists public.sohbet_mesajlari (
  id        uuid primary key default gen_random_uuid(),
  lig_id    uuid not null references public.ligler(id) on delete cascade,
  takim_id  uuid references public.takimlar(id) on delete cascade,  -- null = lig geneli kanal
  user_id   uuid not null references auth.users(id) on delete cascade,
  ad        text not null,                    -- gönderenin adı (anlık göster)
  metin     text not null,
  silindi   boolean not null default false,   -- moderasyon
  olusma    timestamptz not null default now()
);
create index if not exists ix_sohbet_kanal on public.sohbet_mesajlari(lig_id, takim_id, olusma);

-- Yetki (bu proje explicit GRANT kullanır; RLS satır bazında ayrıca sınırlar)
grant select, insert, update, delete on public.sohbet_mesajlari to authenticated;

alter table public.sohbet_mesajlari enable row level security;

-- OKUMA: ligi görebilen herkes lig geneli kanalı okur. Takım kanalını
-- sadece o takım kaptanı/lig yöneticisi/admin okur (basit gizlilik).
drop policy if exists p_sohbet_sel on public.sohbet_mesajlari;
create policy p_sohbet_sel on public.sohbet_mesajlari for select to authenticated
  using (
    silindi = false and (
      takim_id is null                          -- lig geneli: giriş yapan herkes
      or public.takim_yoneticim(takim_id)       -- takım kanalı: kaptan/lig yön./admin
    )
  );

-- YAZMA: giriş yapmış herkes lig geneli kanala yazar; takım kanalına
-- sadece o takımla ilişkili yönetici. Kendi user_id'siyle.
drop policy if exists p_sohbet_ins on public.sohbet_mesajlari;
create policy p_sohbet_ins on public.sohbet_mesajlari for insert to authenticated
  with check (
    user_id = auth.uid() and (
      takim_id is null
      or public.takim_yoneticim(takim_id)
    )
  );

-- GÜNCELLEME (silme/moderasyon): kendi mesajı VEYA lig yöneticisi/admin
drop policy if exists p_sohbet_upd on public.sohbet_mesajlari;
create policy p_sohbet_upd on public.sohbet_mesajlari for update to authenticated
  using (user_id = auth.uid() or public.lig_yoneticim(lig_id))
  with check (true);

-- Realtime yayınına ekle (Supabase: supabase_realtime publication)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sohbet_mesajlari'
  ) then
    alter publication supabase_realtime add table public.sohbet_mesajlari;
  end if;
end $$;
