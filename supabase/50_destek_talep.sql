-- =====================================================================
--  ForzaLig — 🆘 SORUN BİLDİR (kullanıcı-başlatan destek + teşhis)
--  Kullanıcı bir sorun bildirir; hassas olmayan teşhis paketi eklenir.
--  Süper admin görür/kapatır. Additive, idempotent. Supabase → Run.
-- =====================================================================
create table if not exists public.destek_talep (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete set null,
  ad        text,
  email     text,
  sayfa     text,                       -- sorunun yaşandığı ekran
  mesaj     text,                       -- kullanıcının notu
  teshis    jsonb,                      -- otomatik teşhis (cihaz, sürüm, rol, sayaçlar…) — hassas veri yok
  durum     text not null default 'yeni',   -- yeni / inceleniyor / kapandi
  olusma    timestamptz not null default now()
);
create index if not exists ix_destek_durum on public.destek_talep(durum, olusma desc);

alter table public.destek_talep enable row level security;
drop policy if exists p_destek_ins on public.destek_talep;
create policy p_destek_ins on public.destek_talep for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);
drop policy if exists p_destek_sel on public.destek_talep;
create policy p_destek_sel on public.destek_talep for select to authenticated
  using (public.admin_mi() or user_id = auth.uid());     -- kullanıcı kendi talebini de görebilir (şeffaflık)
drop policy if exists p_destek_upd on public.destek_talep;
create policy p_destek_upd on public.destek_talep for update to authenticated
  using (public.admin_mi()) with check (public.admin_mi());
grant insert, select, update on public.destek_talep to authenticated;
-- =====================================================================
